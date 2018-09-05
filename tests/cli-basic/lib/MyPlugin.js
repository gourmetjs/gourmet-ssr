"use strict";

class MyPlugin {
  _onSay({argv, command}) {
    console.log("command:", command);
    console.log("argv:", JSON.stringify(argv));
  }
}

MyPlugin.meta = {
  commands: {
    say: {
      options: {
        decorate: {
          alias: "e"
        }
      }
    }
  },
  hooks: {
    "command:say": MyPlugin.prototype._onSay
  }
};

module.exports = MyPlugin;
