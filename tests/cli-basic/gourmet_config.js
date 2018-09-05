"use strict";

module.exports = {
  // Three user plugins will be loaded:
  //  1. "@gourmet/test-cli-test-plugin" - auto loaded
  //  2. "@gourmet/test-cli-test-plugin" - manually by `plugins: [...]`
  //     (located here because of `before: ".../my-plugin"` in `meta.schema`)
  //  3. "@gourmet/test-cli-basic/my-plugin" - manually by `plugins: [...]`
  plugins: [{
    name: "@gourmet/test-cli-basic/my-plugin",
    plugin: require.resolve("./lib/MyPlugin")
  }, {
    name: "@gourmet/test-cli-test-plugin",
    options: {message: "Greetings!"}
  }]
};
