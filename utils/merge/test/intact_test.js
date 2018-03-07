"use strict";

const test = require("tape");
const merge = require("..");

test("merge.intact: three objects", t => {
  const m = merge.intact({a:1}, {b:2}, {c:3});
  const e = {a:1, b:2, c:3};
  t.deepEqual(m, e, "three objects");
  t.equal(m.__safeToWrite__, true, "__safeToWrite__");
  t.end();
});

test("merge.intact: only one object", t => {
  const e = {b:2};
  const m = merge.intact(null, e, null);
  t.equal(m, e, "no copy");
  t.end();
});

test("merge.intact: no object", t => {
  const m = merge.intact(null, undefined, true, "foo", ["bar"]);
  t.equal(m, undefined, "undefined");
  t.end();
});
