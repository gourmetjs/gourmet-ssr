"use strict";

const npath = require("path");
const resolve = require("resolve");
const relativePath = require("@gourmet/relative-path");

class PluginReactLoadable {
  onPipelines(context) {
    const target = context.target;
    return {
      js: [{
        name: "#babel-loader",
        options: {
          plugins: [{
            name: "@gourmet/babel-plugin-gourmet-loadable",
            plugin: require.resolve("@gourmet/babel-plugin-gourmet-loadable"),
            options: {
              libraryName: "@gourmet/react-loadable",
              modules: target === "server",
              resolveModule(moduleName, refPath) {
                const extensions = context.config.builder.defaultExtensions;
                let path;

                try {
                  path = resolve.sync(moduleName, {
                    basedir: refPath ? npath.dirname(refPath) : context.workDir,
                    extensions
                  });
                } catch (err) {
                  if (err.code === "MODULE_NOT_FOUND")
                    return null;
                  throw err;
                }

                return relativePath(path, context.workDir);
              }
            }
          }]
        }
      }]
    };
  }
}

PluginReactLoadable.meta = {
  hooks: {
    "build:webpack_pipelines": PluginReactLoadable.prototype.onPipelines
  }
};

module.exports = PluginReactLoadable;
