"use strict";

module.exports = {
  plugins: [{
    name: "@gourmet/example-cli-basic/my-plugin",
    plugin: require.resolve("./lib/MyPlugin")
  }, {
    name: "@gourmet/example-cli-test-plugin",
    options: {message: "Greetings!"}
  }]
};
