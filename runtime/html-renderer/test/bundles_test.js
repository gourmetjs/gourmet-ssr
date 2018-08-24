"use strict";

const test = require("tape");
const HtmlServerRenderer = require("../src/getHtmlServerRenderer")();

test("getBundles() basic", t => {
  const r = new HtmlServerRenderer();
  const gmctx = r.createContext(null, {
    entrypoint: "main",
    manifest: {
      client: {
        files: {
          "a.bundle.js": {
            modules: ["a"]
          },
          "ab.bundle.js": {
            modules: ["a", "b"]
          },
          "c.bundle.js": {
            modules: ["c"]
          },
          "bc.bundle.js": {
            modules: ["b", "c"]
          }
        },
        modules: {
          a: "./src/a.js",
          b: "./src/b.js",
          c: "./src/c.js"
        }
      }
    }
  });

  t.deepEqual(
    r.getBundles(gmctx, [
      "./src/a.js",
      "./src/b.js",
      "./src/c.js"
    ]),
    [
      "ab.bundle.js",
      "bc.bundle.js"
    ]
  );

  t.deepEqual(
    r.getBundles(gmctx, [
      "./src/a.js",
      "./src/b.js",
      "./src/c.js"
    ], ["ab.bundle.js"]),
    [
      "c.bundle.js"
    ]
  );

  t.deepEqual(
    r.getBundles(gmctx, [
      "./src/a.js",
      "./src/b.js"
    ]),
    [
      "ab.bundle.js"
    ]
  );

  t.end();
});
