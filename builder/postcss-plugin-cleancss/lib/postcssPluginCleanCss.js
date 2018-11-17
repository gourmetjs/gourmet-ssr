// This source code is based on https://github.com/leodido/postcss-clean
"use strict";

const postcss = require("postcss");
const CleanCss = require("clean-css");

module.exports = postcss.plugin("cleancss", opts => {
  const cleancss = new CleanCss(opts);
  return (css, res) => {
    return new Promise((resolve, reject) => {
      cleancss.minify(css.toString(), (err, min) => {
        if (err)
          return reject(err);

        for (const w of min.warnings)
          res.warn(w);

        res.root = postcss.parse(min.styles);
        resolve();
      });
    });
  };
});
