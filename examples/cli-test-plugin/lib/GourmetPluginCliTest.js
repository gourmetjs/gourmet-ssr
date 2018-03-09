"use strict";

class GourmetPluginCliTest {
  constructor({message}) {
    this.message = message;
  }

  _onSay(options) {
    const message = options.decorate ? `** ${this.message} **` : this.message;
    console.log(message);
    return false; // pass through
  }
}

GourmetPluginCliTest.meta = {
  hooks: {
    "command:say": GourmetPluginCliTest.prototype._onSay
  },
  schema: {
    before: "@gourmet/example-cli-basic/my-plugin",
    options: {
      message: "Hello, world!"
    }
  }
};

module.exports = GourmetPluginCliTest;
