"use strict";

class MyPlugin {
  _onSay({argv}) {
    console.log("command:", argv.$command);
    console.log("argv:", JSON.stringify(argv));
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
