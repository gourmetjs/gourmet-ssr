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

- By default, vendor modules from `node_modules` will not be complied and copied as-is for better build performance.
- However, source files located under one of directories specified in `vendorSourceDirs` will be included in compilation.
 - Default value is `["gourmet-source"]`.

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
- hash encoding is always `base62` and collision from case insensitive file system (Windows & Mac) is handled by increasing the truncation length dynamically
- however, we recommend to use case sensitive file system (Linux) to avoid this issue in the first place

## Customizing bundling

- In addition to `builder.granularity`, you can further customize bundling process using `builder.bundles` as follows.

```js
// gourmet_config.js
module.exports = {
  // ...
  builder: {
    bundles: {
      react: ["react", "react-dom"],
      components: "./src/components",
      containers: "./src/containers"
    }
  }
};
```

- This will create a single bundle file containing both `react` and `react-dom` instead of two separate bundles.
- This will create two bundle files `components` and `containers` containing all files under specified directories.
- By grouping together tightly related files into a single bundle, you can expect better possibility of cache hit on the browser.

## Polyfill

- IE 11 is supported.
- Transpilation and polyfill are automatically enabled based on the value of `builder.runtime` & `babel.polyfill`.

## Troubleshooting

### `Module not found: Error: Can't resolve 'core-js/...'`

This is a Bable issue. Add `core-js@2` to your `devDependencies` like `"core-js": "2"`.
See Babel documentation](https://babeljs.io/docs/en/babel-preset-env#usebuiltins) for more details.
