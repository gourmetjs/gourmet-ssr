"use strict";

const npath = require("path");
const relativePath = require("@gourmet/relative-path");
const sortPlugins = require("@gourmet/plugin-sort");

class GourmetPluginWebpackBabel {
  onDefaultConfig(context) {
    return {
      babel: {
        // Disable Babel's project-wide configuration file (`babel.config.js`) because
        // `gourmet_config.js` plays the some role in Gourmet Builder.
        // You can enable this if you prefer Babel-natural way of Babel configuration.
        // Be cautious though because Gourmet Builder will specify programmatically
        // generated Babel configuration via its API and this may conflict with Babel
        // configuration files.
        // https://babeljs.io/docs/en/config-files#project-wide-configuration
        configFile: false,

        // Babel's project root directory to load `babel.config.js` file.
        root: context.workDir,

        // Disable Babel's file-relative configuration files by default.
        // See `configFile` option above for a caution when you enable this option.
        // https://babeljs.io/docs/en/config-files#file-relative-configuration
        babelrc: false,

        // Babel has its own `env` based options merging feature.
        // We use `stage` as `envName` for client build and `{stage}:server` for server build
        // (e.g. `"prod"` for client build and `"prod:server"` for server build).
        // See: https://babeljs.io/docs/en/options#env
        envName: context.target === "server" ? context.stage + ":server" : context.stage,

        // Loosen the level of standard conformity for a smaller output and better performance.
        // This is a global option that is given to all presets and plugins.
        loose: true,

        // Use standard JavaScript built-ins instead of internal Babel helpers.
        // I.e. Use `Object.assign()` instead of `_extend()`.
        // This is a global option that is given to all presets and plugins.
        useBuiltIns: true,

        // Enable more spec compliant, but potentially slower, transformations.
        // This is a global option that is given to all presets and plugins.
        spec: false,

        // This options is the same as `useBuiltIns` of `@babel/preset-env`.
        //  - `"usage"`: Insert reference to polyfills (`require("core-js/...")`) at the top of
        //    each file for the features that it uses but the target environment doesn't support.
        //  - `"entry"`: Add an entry file to all pages, containing reference to all individual
        //    polyfills that the target environment doesn't support.
        //  - `false`: Turn off the automatic polyfilling. It is the user's responsibility
        //    to include required polyfills.
        // For simple projects, `"usage"` will generate a smaller output. However, if your project
        // contains many source files that have references to polyfills, they will all add up and
        // may result in a bigger output. `"entry"` can be a better option for that kind of projects.
        polyfill: "usage",

        // Where to load browserslist configuration:
        //  - "gourmet": global setting from `builder.runtime` of `gourmet_config.js`.
        //  - "root": single location configuration lookup beginning at project's root directory
        //  - "file": file-relative configuration lookup beginning at each source file's directory
        // * See https://github.com/browserslist/browserslist#queries for more details about
        //   browserslist's configuration files.
        browserslist: "gourmet",  // "gourmet", "root", "file",

        // Include transformations that are in proposal state.
        // 3 is the highest level that is almost finished to become a part of standard.
        // 0 is the lowest level that is extremely experimental.
        // https://tc39.github.io/process-document/
        // Currently, only possible value for this options is either `false` or `3`.
        withProposals: 3,

        // Note that the format of `presets` and `plugins` is extended from Babel's.
        // Preset: `{name: "name", preset: "optional_path_to_preset", options: {...}}`
        // Plugin: `{name: "name", plugin: "optional_path_to_preset", options: {...}}`
        presets: [],
        plugins: []
      }
    };
  }

  onInit(context) {
    this._vendorSourceDirs = context.config.builder.vendorSourceDirs.map(dir => {
      if (typeof dir !== "string")
        return dir;
      if (dir[0] !== "/")
        dir = "/" + dir;
      if (dir[dir.length - 1] !== "/")
        dir = dir + "/";
      return dir;
    });
  }

  onPipelines(context) {
    // Note that the object returned from this hook is merged with other
    // plugins's result. Arrays are appended by default, so `presets` and
    // `plugins` are appended too.
    const babel = context.config.babel;
    const bl = babel.browserslist;

    return {
      js: [{
        name: "babel-loader",
        loader: bl === "file" ? npath.join(__dirname, "custom-babel-loader.js") : require.resolve("babel-loader"),
        options: {
          sourceType: "unambiguous",
          configFile: babel.configFile,
          root: babel.root,
          babelrc: babel.babelrc,
          envName: babel.envName,
          presets: [{
            name: "@babel/preset-env",
            preset: require.resolve("@babel/preset-env"),
            options: {
              modules: false,
              configPath: context.workDir,
              targets: bl === "gourmet" ? context.config.builder.runtime[context.target] : null,
              ignoreBrowserslistConfig: bl === "gourmet",
              useBuiltIns: babel.polyfill,  // `@babel/preset-env` interprets `useBuiltIns` a little differently.

              // https://github.com/facebook/create-react-app/blob/1d8d9eaaeef0e4dbcefedac40d3f18b892c8c18b/packages/babel-preset-react-app/create.js#L91
              exclude: ["transform-typeof-symbol"]
            }
          }].concat(babel.presets),

          plugins: (() => {
            const plugins = [];

            if (context.target === "client") {
              plugins.push({
                name: "@babel/plugin-syntax-dynamic-import",
                plugin: require.resolve("@babel/plugin-syntax-dynamic-import")
              });
            } else {
              plugins.push({
                name: "babel-plugin-dynamic-import-node",
                plugin: require.resolve("babel-plugin-dynamic-import-node")
              });
            }

            if (babel.withProposals !== false) {
              if (babel.withProposals >= 3) {
                plugins.push({
                  name: "@babel/plugin-syntax-import-meta",
                  plugin: require.resolve("@babel/plugin-syntax-import-meta")
                });

                plugins.push({
                  name: "@babel/plugin-proposal-class-properties",
                  plugin: require.resolve("@babel/plugin-proposal-class-properties")
                });

                plugins.push({
                  name: "@babel/plugin-proposal-json-strings",
                  plugin: require.resolve("@babel/plugin-proposal-json-strings")
                });
              }
            }

            // We can't turn this on by default due to the following issue:
            // https://github.com/webpack/webpack/issues/4039
            //
            //   "babel-plugin-transform-runtime"

            return plugins.concat(babel.plugins);
          })()
        }
      }],
      js_copy: []
    };
  }

  onLoaders(context) {
    return {
      js: {
        extensions: [".js"],
        select: {
          js_copy: {
            order: 9900,
            test: [context.builder.getDirTester("node_modules", (path, idx, dir) => {
              return !this._isSource(path, idx, dir);
            })],
            pipeline: "js_copy"
          },
          js: {
            order: 9999,
            pipeline: "js"
          }
        }
      }
    };
  }

  onLoaderOptions(options, name, context) {
    function _sort(items) {
      const babel = context.config.babel;
      return items && sortPlugins(items, {
        normalize(item) {
          return typeof item === "string" ? {name: item} : item;
        },
        finalize(item) {
          return [item.preset || item.plugin || item.name, item.options || {}, item.name];
        },
        schema: {
          "*": {
            options: {
              loose: babel.loose,
              useBuiltIns: babel.useBuiltIns,
              spec: babel.spec
            }
          }
        }
      });
    }

    if (options) {
      const presets = Array.isArray(options.presets) && options.presets.length && options.presets;
      const plugins = Array.isArray(options.plugins) && options.plugins.length && options.plugins;
      if (presets || plugins) {
        return Object.assign({}, options, {
          presets: _sort(presets),
          plugins: _sort(plugins)
        });
      }
    }
    return options;
  }

  _isSource(path, idx, dir) {
    const dirs = this._vendorSourceDirs;

    path = relativePath(path);

    for (let idx = 0; idx < dirs.length; idx++) {
      const pattern = dirs[idx];
      if (typeof pattern === "string") {
        const spos = idx + dir.length;
        if (path.indexOf(pattern, spos) !== -1)
          return true;
      } else if (pattern instanceof RegExp) {
        if (pattern.test(path))
          return true;
      } else {
        throw Error("Invalid pattern");
      }
    }

    return false;
  }
}

GourmetPluginWebpackBabel.meta = {
  hooks: {
    "build:default_config": GourmetPluginWebpackBabel.prototype.onDefaultConfig,
    "build:init": GourmetPluginWebpackBabel.prototype.onInit,
    "build:webpack_pipelines": GourmetPluginWebpackBabel.prototype.onPipelines,
    "build:webpack_loaders": GourmetPluginWebpackBabel.prototype.onLoaders,
    "build:webpack_loader_options:babel-loader": GourmetPluginWebpackBabel.prototype.onLoaderOptions
  }
};

module.exports = GourmetPluginWebpackBabel;
