"use strict";

const fs = require("fs");
const npath = require("path");
const test = require("tape");

const outputDir = npath.join(__dirname, "../../../.gourmet/babel-polyfill");

// /***/ (function(module, exports, __webpack_require__) {
// 
// "use strict";
// 
// <<<FROM-HERE>>>__webpack_require__(/*! core-js/modules/es6.promise */ "../../node_modules/core-js/modules/es6.promise.js");
// 
// module.exports = function promiseProtect(handler) {<<<TO-HERE>>>
//   return new Promise(function (resolve, reject) {
//     try {

test("Verify `polyfill: \"usage\"`", t => {
  const content = fs.readFileSync(npath.join(outputDir, "local/client/main.js"), "utf8");
  const check = /__webpack_require__\([/*! \w.-]+"[./\w]+core-js\/modules\/es6\.promise\.js"\);\s+module\.exports = function promiseProtect\(handler\) {/.test(content);

  t.ok(check, "'usage' mode should inject polyfills at the place of references");

  t.end();
});

// /*!************************************************************************************!*\
//  !*** C:/kjnk/work/gourmet-ssr/builder/webpack-babel/<<<FROM-HERE>>>gmsrc/babel-polyfill-entry.js ***!
//  \************************************************************************************/
// /*! no static exports found */
// /***/ (function(module, exports, __webpack_require__) {
//
// __webpack_require__(/*! core-js/modules<<<TO-HERE>>>/es6.array.copy-within */ "../../node_modules/core-js/modules/es6.array.copy-within.js");
//
test("Verify `polyfill: \"entry\"`", t => {
  const content = fs.readFileSync(npath.join(outputDir, "entry/client/main.js"), "utf8");
  const check = /gmsrc\/babel-polyfill-entry\.js[\s*/!\w\\]+\(function\(module, exports, __webpack_require__\) {\s+__webpack_require__\([/*! \w.-]+"[./\w]+core-js\/modules/.test(content);

  t.ok(check, "'entry' mode should insert an expanded 'babel-polyfill-entry.js' at the entry");

  t.end();
});
