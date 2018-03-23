"use strict";

function _conv(tbl) {
  return Object.keys(tbl).reduce((obj, name) => {
    obj[name] = `\u001b[${tbl[name]}m`;
    return obj;
  }, {});
}

function _null(tbl) {
  return Object.keys(tbl).reduce((obj, name) => {
    obj[name] = "";
    return obj;
  }, {});
}

const off = _conv({
  all: 0,
  reset: 0,
  bold: 22,
  underline: 24,
  inverse: 27,
  color: 39,
  bg: 49
});

const code = _conv({
  bold: 1,
  underline: 4,
  inverse: 7,

  black: 30,
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  magenta: 35,
  cyan: 36,
  white: 37,

  brightBlack: 90,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightMagenta: 95,
  brightCyan: 96,
  brightWhite: 97,

  bgBlack: 40,
  bgRed: 41,
  bgGreen: 42,
  bgYellow: 43,
  bgBlue: 44,
  bgMagenta: 45,
  bgCyan: 46,
  bgWhite: 47,

  bgBrightBlack: 100,
  bgBrightRed: 101,
  bgBrightGreen: 102,
  bgBrightYellow: 103,
  bgBrightBlue: 104,
  bgBrightMagenta: 105,
  bgBrightCyan: 106,
  bgBrightWhite: 107
});

function _off(name) {
  if (off[name])
    return off[name]; // bold, underline, inverse
  return name.startsWith("bg") ? off.bg : off.color;
}

const colors = Object.keys(code).reduce((obj, name) => {
  obj[name] = str => code[name] + str + _off(name);
  return obj;
}, {});

colors.code = code;
colors.off = off;

const disabled = Object.keys(code).reduce((obj, name) => {
  obj[name] = str => str;
  return obj;
}, {});

disabled.code = _null(code);
disabled.off = _null(off);

colors.disabled = disabled;

module.exports = colors;
