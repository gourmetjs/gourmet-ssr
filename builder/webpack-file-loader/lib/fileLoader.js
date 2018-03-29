"use strict";

function fileLoader(content) {
  const options = this.query;

  if (typeof options.name !== "function")
    throw Error("'name' option must be a function");

  const name = options.name.call(null, {
    content,
    path: this.resourcePath
  });

  if (options.emitFile === undefined || options.emitFile)
    this.emitFile(name, content);

  return `module.exports = __webpack_public_path__ + "${name}";`;
}

fileLoader.raw = true;

module.exports = fileLoader;
