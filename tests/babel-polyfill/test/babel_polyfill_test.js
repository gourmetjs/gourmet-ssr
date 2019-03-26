"use strict";

const fs = require("fs");
const npath = require("path");
const test = require("tape");

const outputDir = npath.join(__dirname, "../../../.gourmet/babel-polyfill");

// /*!*********************!*\
//   !*** ./src/main.js ***!
//   \*********************/
// /*! no static exports found */
// /***/ (function(module, exports, __webpack_require__) {
//   "use strict";
// 
//   __webpack_require__(/*! core-js/modules/es.object.to-string */ "../../node_modules/core-js/modules/es.object.to-string.js");
//   
//   __webpack_require__(/*! core-js/modules/es.promise */ "../../node_modules/core-js/modules/es.promise.js");
//   
//   module.exports = function main() {
//     return Promise.resolve("<div>Hello, world!</div>");
//   };
test("Verify `polyfill: \"usage\"`", t => {
  const content = fs.readFileSync(npath.join(outputDir, "local/client/main.js"), "utf8");
  const check = /\*\*\* \.\/src\/main\.js \*\*\*(.|\n|\r)+es\.promise\.js(.|\n|\r)+module\.exports = function main\(\) {/.test(content);
  
  t.ok(check, "'usage' mode should inject polyfills at the place of references");

  t.end();
});

// /*!*******************************************************************************!*\
//   !*** C:/kjnk/work/gourmet-ssr/builder/webpack-babel/gmsrc/entry-corejs-v3.js ***!
//   \*******************************************************************************/
// /*! no static exports found */
// /***/ (function(module, exports, __webpack_require__) {
// 
//   __webpack_require__(/*! core-js/modules/es.symbol */ "../../node_modules/core-js/modules/es.symbol.js");
//   __webpack_require__(/*! core-js/modules/es.symbol.description */ "../../node_modules/core-js/modules/es.symbol.description.js");
//   __webpack_require__(/*! core-js/modules/es.symbol.async-iterator */ "../../node_modules/core-js/modules/es.symbol.async-iterator.js");
//
test("Verify `polyfill: \"entry\"`", t => {
  const content = fs.readFileSync(npath.join(outputDir, "entry/client/main.js"), "utf8");
  const check = /gmsrc\/entry-corejs-v3\.js[\s*/!\w\\]+\(function\(module, exports, __webpack_require__\) {\s+__webpack_require__\([/*! \w.-]+"[./\w]+core-js\/modules/.test(content);

  t.ok(check, "'entry' mode should insert an expanded 'babel-polyfill-entry.js' at the entry");

  t.end();
});
