"use strict";

const test = require("tape");
const HashNames = require("..");

test("HashNames basics", t => {
  const hashNames = new HashNames();

  let info = hashNames.getHashName("Hello, world!");

  t.deepEqual(info, {
    key: "l9hRRUOhKqFuQZcPLvN7M8r5mlz",
    name: "l9hR"
  });

  // Add an entry to make a conflict
  hashNames._names["1HYPQr2xj1nmnkQXBCJXUdQoy5l"] = {
    name: "1HYP",
    namei: "1hyp"
  };

  info = hashNames.getHashName("foo");

  t.deepEqual(info, {
    key: "1HyPQr2xj1nmnkQXBCJXUdQoy5l",
    name: "1HyPQ"  // 5 chars due to a conflict
  });

  info = hashNames.getHashName("Hello, world!", {addNew: false});

  t.deepEqual(info, {
    key: "l9hRRUOhKqFuQZcPLvN7M8r5mlz",
    name: "l9hR"
  });

  t.deepEqual(hashNames.serialize(), {
    "l9hRRUOhKqFuQZcPLvN7M8r5mlz": "l9hR",
    "1HYPQr2xj1nmnkQXBCJXUdQoy5l": "1HYP",
    "1HyPQr2xj1nmnkQXBCJXUdQoy5l": "1HyPQ"
  });

  t.end();
});

test("HashNames long conflicts", t => {
  const hashNames = new HashNames({hashType: "md5"});

  const hash = "1H7lwuiRG1ZBDSTfkgKopq";

  for (let idx = 4; idx <= hash.length; idx++) {
    const name = hash.substr(0, idx);
    const key = name + "-".repeat(hash.length - idx);
    hashNames._names[key] = {
      name,
      namei: name.toLowerCase()
    };
  }

  for (let idx = 0; idx < 3; idx++) {
    const name = hash + idx.toString(16);
    hashNames._names[name] = {
      name,
      namei: name.toLowerCase()
    };
  }

  t.deepEqual(hashNames.getHashName("bar"), {
    key: "1H7lwuiRG1ZBDSTfkgKopQ",
    name: "1H7lwuiRG1ZBDSTfkgKopQ3"
  });

  t.deepEqual(hashNames.serialize(), {
    "1H7l------------------": "1H7l",
    "1H7lw-----------------": "1H7lw",
    "1H7lwu----------------": "1H7lwu",
    "1H7lwui---------------": "1H7lwui",
    "1H7lwuiR--------------": "1H7lwuiR",
    "1H7lwuiRG-------------": "1H7lwuiRG",
    "1H7lwuiRG1------------": "1H7lwuiRG1",
    "1H7lwuiRG1Z-----------": "1H7lwuiRG1Z",
    "1H7lwuiRG1ZB----------": "1H7lwuiRG1ZB",
    "1H7lwuiRG1ZBD---------": "1H7lwuiRG1ZBD",
    "1H7lwuiRG1ZBDS--------": "1H7lwuiRG1ZBDS",
    "1H7lwuiRG1ZBDST-------": "1H7lwuiRG1ZBDST",
    "1H7lwuiRG1ZBDSTf------": "1H7lwuiRG1ZBDSTf",
    "1H7lwuiRG1ZBDSTfk-----": "1H7lwuiRG1ZBDSTfk",
    "1H7lwuiRG1ZBDSTfkg----": "1H7lwuiRG1ZBDSTfkg",
    "1H7lwuiRG1ZBDSTfkgK---": "1H7lwuiRG1ZBDSTfkgK",
    "1H7lwuiRG1ZBDSTfkgKo--": "1H7lwuiRG1ZBDSTfkgKo",
    "1H7lwuiRG1ZBDSTfkgKop-": "1H7lwuiRG1ZBDSTfkgKop",
    "1H7lwuiRG1ZBDSTfkgKopq": "1H7lwuiRG1ZBDSTfkgKopq",
    "1H7lwuiRG1ZBDSTfkgKopq0": "1H7lwuiRG1ZBDSTfkgKopq0",
    "1H7lwuiRG1ZBDSTfkgKopq1": "1H7lwuiRG1ZBDSTfkgKopq1",
    "1H7lwuiRG1ZBDSTfkgKopq2": "1H7lwuiRG1ZBDSTfkgKopq2",
    "1H7lwuiRG1ZBDSTfkgKopQ": "1H7lwuiRG1ZBDSTfkgKopQ3"
  });

  t.end();
});
