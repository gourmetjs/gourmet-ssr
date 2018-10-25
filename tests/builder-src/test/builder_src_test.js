"use strict";

const fs = require("fs");
const npath = require("path");
const test = require("tape");

const outputDir = npath.join(__dirname, "../../../.gourmet/builder-src");

test("Only module-b should be compiled as a source module for `local` stage", t => {
  const client = fs.readFileSync(npath.join(outputDir, "local/client/main.js"), "utf8");
  const server = fs.readFileSync(npath.join(outputDir, "local/server/main.js"), "utf8");

  // `builder.runtime.server` is set to `8` for `local` stage which is high enough
  // not to transform `class` syntax in `module-b`.
  t.ok(/module\.exports = class ModuleA \{\};/.test(client), "client 'module-a' must be intact");
  t.ok(/module\.exports = function ModuleB\(\) \{\s+_classCallCheck\(this, ModuleB\);\s+\};/.test(client), "client 'module-b' must be compiled");
  t.ok(/module\.exports = class ModuleA \{\};/.test(server), "server 'module-a' must be intact");
  t.ok(/module\.exports = class ModuleB \{\};/.test(server), "server 'module-b' must be intact");

  t.end();
});

test("Both module-a & module-b should be compiled as source modules for `test` stage", t => {
  const client = fs.readFileSync(npath.join(outputDir, "test/client/main.js"), "utf8");
  const server = fs.readFileSync(npath.join(outputDir, "test/server/main.js"), "utf8");

  t.ok(/module\.exports = function ModuleA\(\) \{\s+_classCallCheck\(this, ModuleA\);\s+\};/.test(client), "client 'module-a' must be compiled");
  t.ok(/module\.exports = class ModuleB \{\};/.test(server), "server 'module-b' must be intact");
  t.ok(/module\.exports = function ModuleA\(\) \{\s+_classCallCheck\(this, ModuleA\);\s+\};/.test(server), "server 'module-a' must be compiled");
  t.ok(/module\.exports = class ModuleB \{\};/.test(server), "server 'module-b' must be intact");

  t.end();
});
