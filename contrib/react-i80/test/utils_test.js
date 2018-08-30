"use strict";

const test = require("tape");
const {unprefixPath, parseHref} = require("../src/utils");

test("unprefixPath", t => {
  t.equal(unprefixPath("/abc/def", "/abc"), "/def");
  t.equal(unprefixPath("/abc/def", "/abc/"), "/def");
  t.equal(unprefixPath("/abc", "/abc"), "/");
  t.equal(unprefixPath("/abc", "/def"), null);
  t.end();
});

test("parseHref", t => {
  t.deepEqual(parseHref("http://user:pw@www.example.com:8080/foo/bar?a=1&b#here"), {
    origin: "http://user:pw@www.example.com:8080",
    path: "/foo/bar",
    search: "?a=1&b",
    hash: "#here",
    href: "http://user:pw@www.example.com:8080/foo/bar?a=1&b#here"
  });
  t.deepEqual(parseHref("//example.com"), {
    origin: "//example.com",
    path: "/",
    search: "",
    hash: "",
    href: "//example.com"
  });
  t.deepEqual(parseHref("/path/to/something/?query=123"), {
    origin: "",
    path: "/path/to/something/",
    search: "?query=123",
    hash: "",
    href: "/path/to/something/?query=123"
  });
  t.deepEqual(parseHref("example.com"), {
    origin: "",
    path: "example.com",
    search: "",
    hash: "",
    href: "example.com"
  });
  t.deepEqual(parseHref("../foo/bar"), {
    origin: "",
    path: "../foo/bar",
    search: "",
    hash: "",
    href: "../foo/bar"
  });
  t.deepEqual(parseHref("foo/bar"), {
    origin: "",
    path: "foo/bar",
    search: "",
    hash: "",
    href: "foo/bar"
  });
  t.end();
});
