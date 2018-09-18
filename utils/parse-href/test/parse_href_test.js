"use strict";

const test = require("tape");
const parseHref = require("..");

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
  t.deepEqual(parseHref("//example.com?a=1"), {
    origin: "//example.com",
    path: "/",
    search: "?a=1",
    hash: "",
    href: "//example.com?a=1"
  });
  t.deepEqual(parseHref("/foo/bar#here"), {
    origin: "",
    path: "/foo/bar",
    search: "",
    hash: "#here",
    href: "/foo/bar#here"
  });
  t.deepEqual(parseHref("http://localhost:3000/#top"), {
    origin: "http://localhost:3000",
    path: "/",
    search: "",
    hash: "#top",
    href: "http://localhost:3000/#top"
  });
  t.end();
});
