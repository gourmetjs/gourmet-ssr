"use strict";

const test = require("tape");
const HashNames = require("..");

function _serialize(hashNames) {
  const keys = Object.keys(hashNames._names);
  return keys.reduce((obj, key) => {
    obj[key] = hashNames._names[key].name;
    return obj;
  }, {});
}

test("basics", t => {
  const hashNames = new HashNames({
    digestLength: 4
  });

  let info = hashNames.getEntry("Hello, world!");

  t.deepEqual(info, {
    hash: "l9hRRUOhKqFuQZcPLvN7M8r5mlz",
    name: "l9hR"
  });

  // Add an entry to make a collision
  hashNames._names["1HyPaaaaaaaaaaaaaaaaaaaaaaa"] = {
    name: "1HyP",
    namei: "1HyP"
  };

  info = hashNames.getEntry("foo");

  t.deepEqual(info, {
    hash: "1HyPQr2xj1nmnkQXBCJXUdQoy5l",
    name: "1HyPQ"  // 5 chars due to a conflict
  });

  info = hashNames.getEntry("Hello, world!");

  t.deepEqual(info, {
    hash: "l9hRRUOhKqFuQZcPLvN7M8r5mlz",
    name: "l9hR"
  });

  t.deepEqual(_serialize(hashNames), {
    "l9hRRUOhKqFuQZcPLvN7M8r5mlz": "l9hR",
    "1HyPaaaaaaaaaaaaaaaaaaaaaaa": "1HyP",
    "1HyPQr2xj1nmnkQXBCJXUdQoy5l": "1HyPQ"
  });

  t.end();
});

test("overflow collisions due to case insensitivity", t => {
  const LEN = 24;

  const hashNames = new HashNames({
    digestLength: LEN,
    avoidCaseCollision: true
  });

  // Real digest of "bar" is `e63x7qMRBPz6VSwltzKdIDB3ogR`
  const hash = "E63X7QMRBPZ6VSWLTZKDIDB3OGR";

  for (let idx = LEN; idx <= hash.length; idx++) {
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

  t.deepEqual(hashNames.getEntry("bar"), {
    hash: "e63x7qMRBPz6VSwltzKdIDB3ogR",
    name: "e63x7qMRBPz6VSwltzKdIDB3ogR3"
  });

  t.deepEqual(_serialize(hashNames), {
    "E63X7QMRBPZ6VSWLTZKDIDB3---": "E63X7QMRBPZ6VSWLTZKDIDB3",
    "E63X7QMRBPZ6VSWLTZKDIDB3O--": "E63X7QMRBPZ6VSWLTZKDIDB3O",
    "E63X7QMRBPZ6VSWLTZKDIDB3OG-": "E63X7QMRBPZ6VSWLTZKDIDB3OG",
    "E63X7QMRBPZ6VSWLTZKDIDB3OGR": "E63X7QMRBPZ6VSWLTZKDIDB3OGR",
    "E63X7QMRBPZ6VSWLTZKDIDB3OGR0": "E63X7QMRBPZ6VSWLTZKDIDB3OGR0",
    "E63X7QMRBPZ6VSWLTZKDIDB3OGR1": "E63X7QMRBPZ6VSWLTZKDIDB3OGR1",
    "E63X7QMRBPZ6VSWLTZKDIDB3OGR2": "E63X7QMRBPZ6VSWLTZKDIDB3OGR2",
    "e63x7qMRBPz6VSwltzKdIDB3ogR": "e63x7qMRBPz6VSwltzKdIDB3ogR3"
  });

  t.end();
});
