"use strict";

class GourmetPluginModuleB {
  onSourceModules() {
    return ["@gourmet/test-builder-src-module-b"];
  }
}

GourmetPluginModuleB.meta = {
  hooks: {
    "build:source_modules": GourmetPluginModuleB.prototype.onSourceModules
  }
};

module.exports = GourmetPluginModuleB;
