"use strict";

const fs = require("fs");
const npath = require("path");
const resolveTemplate = require("@gourmet/resolve-template");
const relativePath = require("@gourmet/relative-path");

// Common fields to add to `package.json`
const PACKAGE = resolveTemplate(`{
  "license": "MIT",
  "repository": "https://github.com/gourmetjs/gourmet-ssr/{{pkgPath}}"
}`);

const README = resolveTemplate(
`# {{pkg.name}}
{{desc}}
## About
This is a member package of Gourmet SSR, an open source project for server-side rendering.
See [Gourmet SSR website](https://ssr.gourmetjs.org{{docPath}}) for more information.
`);

function loadPackage(dir) {
  const path = npath.join(dir, "package.json");
  try {
    return require(path);
  } catch (err) {
    if (err.code === "MODULE_NOT_FOUND")
      return null;
    throw err;
  }
}

function writeFile(path, content) {
  if (fs.existsSync(path)) {
    const current = fs.readFileSync(path, "utf8");
    if (content === current)
      return;
  }
  console.log("Updating:", path);
  fs.writeFileSync(path, content, "utf8");
}

function writePackage(dir, pkg) {
  const pkgPath = relativePath(dir, npath.join(__dirname, "../..")).substring(2); // remove `./`
  const pkgMore = JSON.parse(PACKAGE({pkgPath}));
  const content = JSON.stringify(Object.assign({}, pkg, pkgMore), null, 2);
  writeFile(npath.join(dir, "package.json"), content);
}

function writeReadMe(dir, pkg) {
  const pkgSuffix = pkg.name.substring("@gourmet/".length);
  const srcPath = npath.join(dir, "README-SRC.md");
  let t;

  if (fs.existsSync(srcPath)) {
    const content = fs.readFileSync(srcPath, "utf8");
    t = resolveTemplate(content);
  } else {
    t = README;
  }

  let docPath = `/docs/ref/${pkgSuffix}`;
  const refPath = npath.join(__dirname, "../..", docPath, "index.md");

  if (!fs.existsSync(refPath))
    docPath = "";

  let desc = pkg.description || "";

  if (/^[A-Z].*[^.]$/.test(desc)) { // if begins with a upper case and doesn't end with a period
    desc += ".";
  }

  const rmPath = npath.join(dir, "README.md");

  const content = t({
    pkg,
    docPath,
    desc
  });

  writeFile(rmPath, content);
}

function main(dir) {
  const pkg = loadPackage(dir);

  if (!pkg || pkg.private || !pkg.name || !pkg.version || !pkg.name.startsWith("@gourmet/"))
    return;

  writePackage(dir, pkg);
  writeReadMe(dir, pkg);
}

main(process.cwd());
