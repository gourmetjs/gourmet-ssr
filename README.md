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

