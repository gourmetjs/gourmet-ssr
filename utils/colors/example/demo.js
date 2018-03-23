"use strict";

const colors = require("..");
const {code, off} = colors;

Object.keys(code).forEach(name => {
  console.log(colors[name](name));
});

console.log([
  code.bgBrightYellow + code.red,
  "This is red on bright yellow.\n",
  code.black,
  "Now, black on the same background.\n",
  off.reset,
  "Now everything is back to normal!"
].join(""));
