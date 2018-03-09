"use strict";

class MyPlugin {
  _onSay(options) {
    console.log("command:", options.$command);
    console.log("options:", JSON.stringify(options));
  }
}

MyPlugin.meta = {
  commands: {
    say: {
      options: {
        decorate: {
          alias: "d"
        }
      }
    }
  },
  hooks: {
    "command:say": MyPlugin.prototype._onSay
  }
};

module.exports = MyPlugin;
