"use strict";

//${env:FLAT_NAME}
//${opt:path.to.prop}
//${self:path.to.prop}
//${file:../path/to/file?abc, self:path.to.prop | "string" | 123 | null | true | false}
//${s3:bucket/my/path/to/key}

const test = require("tape");
const Variables = require("..");
const Self = require("../lib/sources/Self");

function _vars(obj) {
  const vars = new Variables(obj);
  vars.addSource("self", new Self(vars));
  return vars;
}

test("vars basic", t => {
  const vars = _vars({
    a: "Hello",
    b: {
      c: "world"
    }
  });

  vars.eval("${a}, ${b.c}!").then(value => {
    t.equal(value, "Hello, world!");
  }).then(() => t.end(), t.end);
});
