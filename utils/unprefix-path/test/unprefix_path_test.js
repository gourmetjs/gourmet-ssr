"use strict";

const test = require("tape");
const unprefixPath = require("..");

test("unprefixPath", t => {
  t.equal(unprefixPath("/abc/def", "/abc"), "/def");
  t.equal(unprefixPath("/abc/def", "/abc/"), "/def");
  t.equal(unprefixPath("/abc", "/abc"), "/");
  t.equal(unprefixPath("/abc", "/def"), null);
  t.end();
});
