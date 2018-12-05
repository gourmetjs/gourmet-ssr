"use strict";

function _escape(n) {
  return `\u001b[${n}m`;
}

function _conv(tbl) {
  return Object.keys(tbl).reduce((obj, name) => {
    obj[name] = _escape(tbl[name]);
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

const RANDOM_COLORS = [
  31, // red
  32, // green
  33, // yellow
  //34, // blue
  35, // magenta
  36, // cyan
  91, // brightRed
  92, // brightGreen
  93, // brightYellow
  94, // brightBlue
  95, // brightMagenta
  96  // brightCyan
];

// Pick a random color based on hash value of the text.
function _pick(text) {
  // https://github.com/visionmedia/debug/blob/22f993216dcdcee07eb0601ea71a917e4925a30a/src/common.js#L46
  let hash = 0;

  for (let idx = 0; idx < text.length; idx++) {
    hash  = ((hash << 5) - hash) + text.charCodeAt(idx);
    hash |= 0; // Convert to 32bit integer
  }

  return _escape(RANDOM_COLORS[Math.abs(hash) % RANDOM_COLORS.length]);
}

const colors = Object.keys(code).reduce((obj, name) => {
  obj[name] = str => code[name] + str + _off(name);
  return obj;
}, {});

colors.escape = _escape;
colors.pick = _pick;
colors.code = code;
colors.off = off;

const disabled = Object.keys(code).reduce((obj, name) => {
  obj[name] = str => str;
  return obj;
}, {});

disabled.escape = () => "";
disabled.pick = () => "";
disabled.code = _null(code);
disabled.off = _null(off);

colors.disabled = disabled;

module.exports = colors;
