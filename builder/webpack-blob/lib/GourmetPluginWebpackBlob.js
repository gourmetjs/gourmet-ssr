"use strict";

class GourmetPluginWebpackBlob {
  onPipelines(context) {
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

  onLoaders() {
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
  hooks: {
    "build:pipelines": GourmetPluginWebpackBlob.prototype.onPipelines,
    "build:loaders": GourmetPluginWebpackBlob.prototype.onLoaders
  }
};

module.exports = GourmetPluginWebpackBlob;
