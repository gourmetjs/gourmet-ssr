"use strict";

const fs = require("fs");
const npath = require("path");
const resolveTemplate = require("@gourmet/resolve-template");

const TEMPLATE = resolveTemplate(
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

function main(dir) {
  const pkg = loadPackage(dir);

  if (!pkg || pkg.private || !pkg.name || !pkg.version || !pkg.name.startsWith("@gourmet/"))
    return;

  const pkgname = pkg.name.substring(0, "@gourmet/".length);
  const rmPath = npath.join(dir, "README-SRC.md");
  let t;

  if (fs.existsSync(rmPath)) {
    console.log("'README-SRC.md' exists, `README.md` will be generated from it...");
    const content = fs.readFileSync(rmPath, "utf8");
    t = resolveTemplate(content);
  } else {
    t = TEMPLATE;
  }

  const docPath = `/docs/ref/${pkgname}/index.md`;
  let desc = pkg.description || "";

  if (/^[A-Z].*[^.]$/.test(desc)) { // if begins with a upper case and doesn't end with a period
    desc += ".";
  }

  if (fs.existsSync(npath.join(dir, "README.md")))
    console.warn("README.md exists");

  console.log(t({
    pkg,
    docPath,
    desc
  }));
}

main(process.cwd());
