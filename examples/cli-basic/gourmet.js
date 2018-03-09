"use strict";

module.exports = {
  // Three user plugins will be loaded:
  //  1. "@gourmet/example-cli-test-plugin" - auto loaded
  //  2. "@gourmet/example-cli-test-plugin" - manually by `plugins: [...]`
  //     (located here because of `before: ".../my-plugin"` in `meta.schema`)
  //  3. "@gourmet/example-cli-basic/my-plugin" - manually by `plugins: [...]`
  plugins: [{
    name: "@gourmet/example-cli-basic/my-plugin",
    plugin: require.resolve("./lib/MyPlugin")
  }, {
    name: "@gourmet/example-cli-test-plugin",
    options: {message: "Greetings!"}
  }]
};
