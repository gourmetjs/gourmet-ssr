"use strict";

const Console = require("./Console");

// singleton object
let con;

function getConsole(props) {
  if (!con)
    con = new Console();
  return props ? con.create(props) : con;
}

getConsole.install = function(_con) {
  con = _con;
};

module.exports = getConsole;
