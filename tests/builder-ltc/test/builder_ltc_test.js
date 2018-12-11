"use strict";

const fs = require("fs");
const npath = require("path");
const test = require("tape");
const mkdirp = require("mkdirp");
const pt = require("@gourmet/promise-tape");
const GourmetCli = require("@gourmet/gourmet-cli-impl");

const testDir = npath.join(__dirname, "../../../.gourmet/builder-ltc/src");

function _build() {
  const cli = new GourmetCli();
  return cli.runCommand({
    stage: "ltc",
    workDir: npath.join(__dirname, ".."),
    _: ["build"]
  }).then(context => {
    return context.builder.manifest;
  });
}

test("create src directory", t => {
  mkdirp.sync(testDir);
  t.end();
});

test("build and verify", pt(async t => {
  fs.writeFileSync(npath.join(testDir, "message.js"), 'export default "Hello, world!";');

  const oldManifest = await _build();
  const oldFiles = oldManifest.client.files;
  const oldModules = oldManifest.client.modules;

  fs.writeFileSync(npath.join(testDir, "message.js"), 'export default "Hello, world?";');

  const newManifest = await _build();
  const newFiles = newManifest.client.files;
  const newModules = newManifest.client.modules;

  const a = Object.keys(oldFiles);
  const b = Object.keys(newFiles);
  const c = a.filter(x => b.indexOf(x) === -1);
  const d = b.filter(x => a.indexOf(x) === -1);

  t.equal(c.length, 2, "Only two files should be changed");
  t.deepEqual(oldFiles[c[0]].modules, [], "First file should be runtime");
  t.deepEqual(oldFiles[c[1]].modules.map(id => newModules[id]), ["../../.gourmet/builder-ltc/src/message.js"], "Second file should be message.js");

  t.equal(d.length, 2, "Only two files should be changed");
  t.deepEqual(newFiles[d[0]].modules, [], "First file should be runtime");
  t.deepEqual(newFiles[d[1]].modules.map(id => oldModules[id]), ["../../.gourmet/builder-ltc/src/message.js"], "Second file should be message.js");
}));
