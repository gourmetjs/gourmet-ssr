"use strict";

const test = require("tape");
const {unprefixPath, parseUrl} = require("../src/utils");

test("unprefixPath", t => {
  t.equal(unprefixPath("/abc/def", "/abc"), "/def");
  t.equal(unprefixPath("/abc/def", "/abc/"), "/def");
  t.equal(unprefixPath("/abc", "/abc"), "/");
  t.equal(unprefixPath("/abc", "/def"), null);
  t.end();
});

test("parseUrl", t => {
  t.deepEqual(parseUrl("http://user:pw@www.example.com:8080/foo/bar?a=1&b#here"), {
    origin: "http://user:pw@www.example.com:8080",
    path: "/foo/bar",
    search: "?a=1&b",
    hash: "#here"
  });
  t.deepEqual(parseUrl("//example.com"), {
    origin: "//example.com",
    path: "/",
    search: "",
    hash: ""
  });
  t.deepEqual(parseUrl("/path/to/something/?query=123"), {
    origin: "",
    path: "/path/to/something/",
    search: "?query=123",
    hash: ""
  });
  t.deepEqual(parseUrl("example.com"), {
    origin: "",
    path: "example.com",
    search: "",
    hash: ""
  });
  t.deepEqual(parseUrl("../foo/bar"), {
    origin: "",
    path: "../foo/bar",
    search: "",
    hash: ""
  });
  t.deepEqual(parseUrl("foo/bar"), {
    origin: "",
    path: "foo/bar",
    search: "",
    hash: ""
  });
  t.end();
});
