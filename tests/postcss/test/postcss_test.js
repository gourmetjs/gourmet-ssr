"use strict";

const npath = require("path");
const fs = require("fs");
const test = require("tape");

test("check build output", t => {
  function _normalize(content) {
    return content.replace(/\s+/g, " ").trim();
  }

  function _verify(path, expected) {
    let content = fs.readFileSync(npath.join(__dirname, "../../../.gourmet/postcss", path), "utf8");
    content = content.replace(/\s+/g, " ").trim();
    t.equal(_normalize(content), _normalize(expected), path);
  }

  // `autoprefixer` should be given an option `{browsers: ["chrome 67", "ie 11"]}` from
  // `builder.runtime.client` option in `gourmet_config.js`.
  t.equal(_verify("local/client/14U7SeLB.main.css", `
    /* comment */
    :-ms-input-placeholder {
      color: rgba(153, 211, 153, 0.8);
    }
    ::placeholder {
      color: rgba(153, 211, 153, 0.8);
    }
  `));

  // `@gourmet/postcss-plugin-cleancss` should kick in and output must be minified.
  t.equal(_verify("prod/client/cLY6FGaW.css", `
    :-ms-input-placeholder{color:rgba(153,211,153,.8)}::placeholder{color:rgba(153,211,153,.8)}
  `));

  // `autoprefixer` should load an option `chrome 10, ie 10` from `src/.browserslistrc` file
  // by `postcss.browserslist: "file"` option in `gourmet_config.js`.
  t.equal(_verify("file/client/14U7SeLB.main.css", `
    /* comment */
    ::-webkit-input-placeholder {
      color: rgba(153, 211, 153, 0.8);
    }
    :-ms-input-placeholder {
      color: rgba(153, 211, 153, 0.8);
    }
    ::placeholder {
      color: rgba(153, 211, 153, 0.8);
    }
  `));

  // By `postcss.useConfigFile: true` option in `gourmet_config.js`, the default configuration set
  // by Gourmet Builder is turned off and the PostCSS is executed without any API level options.
  // It loads options from its own `postcss.config.js` configuration file.
  t.equal(_verify("config/client/14U7SeLB.main.css", `
    /* comment */
    ::placeholder {
      color: #99d399;
      color: rgba(153, 211, 153, 0.8);
    }
  `));

  t.end();
});
