"use strict";

const test = require("tape");
const PluginResolver = require("..");

test("Default features", t => {
  function myLocalPlugin() {}
  function anotherPlugin() {}

  const resolver = new PluginResolver();

  resolver.add(["fs", {plugin: "path"}]);
  resolver.add(myLocalPlugin);
  resolver.add({
    name: "my-test-plugin",
    plugin: anotherPlugin
  });

  const res = resolver.finalize().map(item => item.plugin);

  t.equal(res.length, 4, "should have 4 plugins");
  t.ok(res[0] === require("fs"), "[0] should be 'fs'");
  t.ok(res[1] === require("path"), "[1] should be 'path'");
  t.ok(res[2] === myLocalPlugin, "[2] should be myLocalPlugin");
  t.ok(res[3] === anotherPlugin, "[3] should be anotherPlugin");
  t.end();
});

test("Item ordering", t => {
  function A() {}
  function B() {}
  function C() {}

  let resolver = new PluginResolver();

  resolver.add({plugin: B, after: "A"});
  resolver.add({plugin: A, before: "C"});
  resolver.add({plugin: C, before: "B"});

  t.deepEqual(resolver.finalize().map(item => item.plugin), [A, C, B], "should be ACB");

  resolver = new PluginResolver();

  resolver.add({plugin: A, after: "C"});
  resolver.add({plugin: B});
  resolver.add({plugin: C, after: "B"});

  t.deepEqual(resolver.finalize().map(item => item.plugin), [B, C, A], "should be BCA");

  resolver = new PluginResolver();

  resolver.add({plugin: A});
  resolver.add({plugin: B, after: "C"});
  resolver.add({plugin: C, before: "A"});

  t.deepEqual(resolver.finalize().map(item => item.plugin), [C, A, B], "should be CAB");

  resolver = new PluginResolver();

  resolver.add({plugin: A, after: "B"});
  resolver.add({plugin: B});
  resolver.add({plugin: C});

  t.deepEqual(resolver.finalize().map(item => item.plugin), [B, A, C], "should be BAC");

  resolver = new PluginResolver();

  resolver.add({plugin: A, after: "C"});
  resolver.add({plugin: B});
  resolver.add({plugin: C, after: "A"});

  t.deepEqual(resolver.finalize().map(item => item.plugin), [C, A, B], "should handle circular reference");

  t.end();
});

test("baseOptions & disable", t => {
  function A() {}
  function B() {}
  function C() {}

  const resolver = new PluginResolver({
    baseOptions: {a: {b: 1}}
  });

  resolver.add({plugin: A, options: {c: 2}});
  resolver.add({plugin: B, options: {a: 1}});
  resolver.add({plugin: C, options: {a: {b: 2, c: {d: 3}}}});
  resolver.add({name: "A", options: {d: 3}});
  resolver.add({name: "B", disable: true});

  const res = resolver.finalize().map(item => [item.name, item.options]);

  t.deepEqual(res, [
    ["A", {a: {b: 1}, c: 2, d: 3}],
    ["C", {a: {b: 2, c: {d: 3}}}]
  ]);

  t.end();
});

test("addObject", t => {
  function A() {}
  function B() {}
  function C() {}

  const resolver = new PluginResolver();

  resolver.addObject({A: A, B: {plugin: B}, C: C});

  const res = resolver.finalize().map(item => item.plugin);

  t.deepEqual(res, [A, B, C]);

  t.end();
});
