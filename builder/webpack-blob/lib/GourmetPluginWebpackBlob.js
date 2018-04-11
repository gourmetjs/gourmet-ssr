"use strict";

class GourmetPluginWebpackBlob {
  _onWebpackPipelines(context) {
    return {
      blob: [{
        name: "@gourmet/webpack-file-loader",
        loader: require.resolve("@gourmet/webpack-file-loader"),
        options: {
          name: context.builder.getAssetFilenameGetter(context),
          emitFile: context.target === "client"
        }
      }]
    };
  }

  _onWebpackLoaders() {
    return {
      blob: {
        extensions: "*",  // this will match all non-registered extensions
        select: {
          blob: {
            order: 9999,
            pipeline: "blob"
          }
        }
      }
    };
  }
}

GourmetPluginWebpackBlob.meta = {
  hooks: (proto => ({
    "build:webpack:pipelines": proto._onWebpackPipelines,
    "build:webpack:loaders": proto._onWebpackLoaders
  }))(GourmetPluginWebpackBlob.prototype)
};

module.exports = GourmetPluginWebpackBlob;
