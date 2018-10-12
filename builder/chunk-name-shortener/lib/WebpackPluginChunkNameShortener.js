"use strict";

const npath = require("path");

const NAME = "WebpackPluginChunckNameShortener";

module.exports = class WebpackPluginChunckNameShortener {
  constructor({hashNames}) {
    this.hashNames = hashNames;
  }

  apply(compiler) {
    if (this.hashNames) {
      compiler.hooks.compilation.tap(NAME, compilation => {
        const {mainTemplate} = compilation;
        mainTemplate.hooks.assetPath.tap(NAME, (path, data) => {
          // When you use dynamic import (`import("...")`), this can get called
          // with path string like the following:
          //  `"" + ({"12":"home","13":"messages","14":"profile","15":"photo"}[chunkId]||chunkId) + ".js"`
          if (data.chunk && path.indexOf("[chunkId]") === -1) {
            const extname = npath.extname(path);
            const dirbase = path.substring(0, path.length - extname.length);
            return this.hashNames.get(dirbase) + extname;
          }
          return path;
        });
      });
      /*
        compilation.hooks.afterOptimizeChunkIds.tap(NAME, chunks => {
          const items = [];
          for (const chunk of chunks) {
            items.push({
              name: (chunk.name || chunk.id) + "",
              chunk
            });
          }
          items.sort((a, b) => {
            if (a.name < b.name)
              return -1;
            else if (a.name > b.name)
              return 1;
            else
              return 0;
          });
          items.forEach(({name, chunk}) => {
            console.log(name);
            chunk.name = this.hashNames.get(name);
          });
        });
      });*/
    }
  }
};
