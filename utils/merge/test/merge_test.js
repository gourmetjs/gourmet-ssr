"use strict";

const test = require("tape");
const merge = require("..");

test("Basic features", t => {
  const a = {
    a: 1,
    b: 3,
    c: {
      d: [1],
      e: "e"
    }
  };
  const b = {
    b: 2,
    c: {
      d: [2, 3],
      f: "f"
    }
  };
  const c = {
    a: 1,
    b: 2,
    c: {
      d: [1,2,3],
      e: "e",
      f: "f"
    }
  };
  t.deepEqual(merge(a, b), c);
  t.end();
});

test("Customizer - replacing object & array", t => {
  const a = {
    a: 1,
    b: {
      c: "c"
    },
    d: [1,2]
  };
  const b = {
    b: merge.custom(() => ({})),
    d: merge.custom(() => [])
  };
  const c = {
    a: 1,
    b: {},
    d: []
  };
  t.deepEqual(merge(a, b), c);
  t.end();
});

test("Customizer - string concatenation", t => {
  const a = {
    a: "hello",
    b: "hi"
  };
  const b = {
    a: merge.custom(des => des + " world"),
    b: "hola"
  };
  const c = {
    a: "hello world",
    b: "hola"
  };
  t.deepEqual(merge(a, b), c);
  t.end();
});

test("Merging arrays", t => {
  const a = {
    a: "A",
    b: ["B"],
    c: {c: 1}
  };
  const b = {
    a: ["B"],
    b: "C",
    c: ["D"]
  };
  const c = {
    a: ["A", "B"],
    b: ["B", "C"],
    c: [{c: 1}, "D"]
  };
  t.deepEqual(merge(a, b), c);
  t.end();
});

test("Merging plain objects", t => {
  function C() {}
  const a = {
    a: "A",
    b: {c: 1},
    c: {d: 2}
  };
  const b = {
    a: {b: 1},
    b: "B",
    c: C
  };
  const c = {
    a: {b: 1},
    b: "B",
    c: C
  };
  const d = merge(a, b);
  t.deepEqual(d, c);
  t.ok(d.a !== b.a, "should be a copy");
  t.ok(d.c === C, "non-plain object should be intact");
  t.end();
});
