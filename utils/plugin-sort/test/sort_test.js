"use strict";

const test = require("tape");
const sortPlugins = require("..");

test("Normalizer & finalizer", t => {
  function C() {}

  const res = sortPlugins([
    "A", {name: "B"}, C
  ], {
    normalize(item) {
      if (typeof item === "string")
        return {name: item};
      else if (typeof item === "function")
        return {name: item.name, plugin: item};
      else
        return item;
    },
    finalize(item) {
      return {
        name: item.name,
        plugin: item.plugin || null
      };
    }
  });

  t.deepEqual(res, [
    {name: "A", plugin: null},
    {name: "B", plugin: null},
    {name: "C", plugin: C}
  ]);

  t.end();
});

function _sort(items) {
  return sortPlugins(items, {
    finalize: item => item.name
  });
}

test("Item ordering - grouping", t => {
  t.deepEqual(
    _sort([
      {name: "late:A", group: 900},
      {name: "late:B", group: 900},
      {name: "A"},
      {name: "early:B", group: 100},
      {name: "early:A", group: 100}
    ]),
    ["early:B", "early:A", "A", "late:A", "late:B"],
    "keeping original order"
  );

  t.deepEqual(
    _sort([
      {name: "late:A", group: 900},
      {name: "late:B", group: 900},
      {name: "A"},
      {name: "early:B", group: 100, after: "early:A"},
      {name: "early:A", group: 100}
    ]),
    ["early:A", "early:B", "A", "late:A", "late:B"],
    "grouping with constraints"
  );

  t.end();
});

test("Item ordering - constraints", t => {
  t.deepEqual(_sort([
    {name: "B", after: "A"},
    {name: "A", before: "C"},
    {name: "C", before: "B"}
  ]), ["A", "C", "B"], "after & before");

  t.deepEqual(_sort([
    {name: "A", after: "C"},
    {name: "B"},
    {name: "C", after: "B"}
  ]), ["B", "C", "A"], "keeping original order");

  t.deepEqual(_sort([
    {name: "A"},
    {name: "B", after: "C"},
    {name: "C", before: "A"}
  ]), ["C", "A", "B"], "two unrelated conditions");

  t.deepEqual(_sort([
    {name: "A", after: "C"},
    {name: "B"},
    {name: "C"},
    {name: "D"}
  ]), ["B", "C", "A", "D"], "keeping original order");

  t.deepEqual(_sort([
    {name: "B"},
    {name: "C"},
    {name: "D"},
    {name: "A", after: "C", before: ["D", "Z"]},
    {name: "E"}
  ]), ["B", "C", "A", "D", "E"], "non-existent target");

  t.deepEqual(_sort([
    {name: "A", after: "E"},
    {name: "B", after: "E"},
    {name: "C", after: "E"},
    {name: "D", after: "E"},
    {name: "E"}
  ]), ["E", "A", "B", "C", "D"], "keeping original order");

  /*
    Same as:
    {name: "A", after: "C"},
    {name: "B"},
    {name: "D", after: "A"},
    {name: "C", after: "D"}
  */
  t.deepEqual(_sort([
    {name: "A", after: "C", before: "D"},
    {name: "B"},
    {name: "D", before: "C"},
    {name: "C"}
  ]), ["B", "D", "C", "A"], "circular reference");

  t.deepEqual(_sort([
    {name: "A", after: "C"},
    {name: "B"},
    {name: "C", after: "A"}
  ]), ["B", "C", "A"], "circular reference");

  t.end();
});

test("virtual items", t => {
  t.deepEqual(
    sortPlugins([
      {name: "A", options: {c: 2}},
      {name: "B", options: {a: 1}},
      {name: "C", options: {a: {b: 2, c: {d: 3}}}},
      {name: "#A", options: {d: 3}},
      {name: "#B", disable: true},
      {name: "#*", options: {a: {b: 1}}}
    ], {
      finalize(item) {
        return {
          name: item.name,
          options: item.options || null
        };
      }
    }),
    [
      {name: "A", options: {a: {b: 1}, c: 2, d: 3}},
      {name: "C", options: {a: {b: 2, c: {d: 3}}}}
    ]
  );
  t.end();
});

test("schema", t => {
  t.deepEqual(
    sortPlugins([
      {name: "A", options: {c: 2}},
      {name: "B", options: {a: 1}},
      {name: "C", options: {a: {b: 2, c: {d: 3}}}},
      {name: "#A", options: {d: 3}},
      {name: "#B", disable: true},
      {name: "#*", options: {a: {b: 1}}}
    ], {
      finalize(item) {
        return {
          name: item.name,
          options: item.options || null
        };
      },
      schema: {
        "*": {options: {d: 4}},
        "A": {after: "C"}
      }
    }),
    [
      {name: "C", options: {a: {b: 2, c: {d: 3}}, d: 4}},
      {name: "A", options: {a: {b: 1}, c: 2, d: 3}}
    ]
  );
  t.end();
});
