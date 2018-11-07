"use strict";

const npath = require("path");

// Provides `configPath` option to `@babel/preset-env` so it can find
// a browserslist's config file based on source file's location.
module.exports = require("babel-loader").custom(babel => {
  return {
    config(cfg) {
      let options = cfg.options;

      if (cfg.hasFilesystemConfig())
        return options;

      const presets = options.presets;

      for (let idx = 0; presets && idx < presets.length; idx++) {
        const item = presets[idx];
        if (item.name === "@babel/preset-env") {
          options = Object.assign({}, options, {
            presets: [].concat(
              presets.slice(0, idx),
              babel.createConfigItem(
                [
                  require.resolve("@babel/preset-env"),
                  Object.assign({}, item.options, {
                    configPath: npath.dirname(options.filename)
                  }),
                  item.name
                ],
                {dirname: item.dirname, type: "preset"}
              ),
              presets.slice(idx + 1)
            )
          });
          return options;
        }
      }

      return options;
    }
  };
});
