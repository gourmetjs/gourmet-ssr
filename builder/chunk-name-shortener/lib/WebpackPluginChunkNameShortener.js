"use strict";

const NAME = "WebpackPluginChunckNameShortener";

module.exports = class WebpackPluginChunckNameShortener {
  constructor({hashNames, contentHash, console}) {
    this.hashNames = hashNames;
    this.contentHash = contentHash;
    this.console = console;
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(NAME, compilation => {
      //this.debugPrintAllAsyncChunks(compilation);

      // Before calculate truncated hash names, sort chunks based on their
      // original names first. This can minimize switching of order even if
      // names collide.
      compilation.hooks.afterHash.tap(NAME, () => {
        const items = [];
        for (const chunk of compilation.chunks) {
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
          // TODO: contentHash embedding
          //if (!name.startsWith("$$runtime~~")) {
          if (this.contentHash)
            name += "." + chunk.contentHash["javascript"];
          chunk.name = this.hashNames.get(name);
          //}
          this.console.debug(`chunk: id=${chunk.id} orgName=${name} newName=${chunk.name} contentHash=`, chunk.contentHash);
        });
      });
    });
  }

  /*
  debugPrintAllAsyncChunks(compilation) {
    compilation.hooks.afterHash.tap(NAME, () => {
      const asyncChunks = new Set();
      for (const chunk of compilation.chunks)
        chunk.getAllAsyncChunks().forEach(chunk => asyncChunks.add(chunk));
      for (const chunk of asyncChunks) {
        console.log(`async chunk: id=${chunk.id} name=${chunk.name}`, chunk.contentHash);
      }
    });
  }
  */
};
