# Debugging

## Debugging server side code

- Run `node --inspect-brk`
- Chrome://inspect
- `builder.sourceMap = true` for setting break points on original source
- If server side code crashes, stack trace at terminal contains original source code information by default (`builder.installSourceMapSupport = false` to turn this off)

## Debugging client side code

- Typical browser side debugging

# Server side environment

- Full Node environment but bundled
- SSR source files are compiled and concatenated into a single bundle file per a page.
- `XMLHttpRequest` & `fetch` are provided as global API.
- How to include external modules without bundle them?

# Module resolution

## Alias

## Webpack config

- Alias: https://webpack.js.org/configuration/resolve/#resolve-aliasfields
- Alias Field (package.json / browser): https://webpack.js.org/configuration/resolve/#resolve-aliasfields
- Externals: https://webpack.js.org/configuration/externals/
- Node: https://webpack.js.org/configuration/node/

## Modules under `node_modules` are not transpiled by default

- By default, JavaScript files under `node_modules` directory are not transpiled to reduce compilation time.
- You can declare specific modules to be transpiled even if they are under `node_moodules` by listing them as an array in `builder.sourceModules`.
```js
// gourmet_config.js
module.exports = {
  builder: {
    sourceModules: ["module-a", "module-b"]
  },
  pages: {
    main: "./src/main.js"
  }
};
```
- Modules can also declare themselves as "source modules" by implementing Gourmet Plugin hook "build:source_modules".

## Controlling modules' linkage using `builder.moduleLinks`

```js
// gourmet_config.js
module.exports = {
  builder: {
    moduleLinks: {
      "react": "client:external",
      "react-dom/server": "external"
    }
  },
  pages: {
    main: "./src/main.js"
  }
};
```

- "react" will be bundled on client and loaded from `node_modules` on server.
- "react-dom/server" will be ignored on client and loaded from `node_modules` on server.

```js
// gourmet_config.js
module.exports = {
  builder: {
    moduleLinks: {
      "domready": "client",
      "classnames": "server",
      "mkdirp": "external",
      "none": false
    }
  },
  pages: {
    main: "./src/main"
  }
};
```

- "domready" will be bundled on client and ignored on server.
- "classname" will be ignored on client and bundled on server.
- "mkdirp" will be ignored on client and loaded from `node_modules` on server.
- "none": will be ignored on both client and server.

## Long-term caching

- enabled with `builder.contentHash` (CLI option: `--content-hash`)
- note that `minify` doesn't change the hash
- hash encoding is always `base62` and collision from case insensitive file system (Windows & Mac) is handled by dynamically increase the truncation length
- however, we recommend to use case sensitive file system (Linux) to avoid this issue in the first place
