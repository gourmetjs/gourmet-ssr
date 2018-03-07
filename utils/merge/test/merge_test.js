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
