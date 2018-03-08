"use strict";

const resolve = require("resolve");
const CliBase = require("@gourmet/cli-base");

class GourmetCli extends CliBase {
  constructor(options) {
    super(Object.assign({
      configBaseName: "gourmet",
      builtinPlugins: []
    }, options));
  }

  isAutoLoadablePlugin(moduleName) {
    const path = resolve.sync(moduleName + "/package.json", {basedir: this.workDir});
    const pkg = require(path);
    const keywords = pkg.keywords;
    return keywords && Array.isArray(keywords) && keywords.indexOf("gourmet-plugin") !== -1;
  }
}

module.exports = GourmetCli;
