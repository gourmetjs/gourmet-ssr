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

test("basic eval", t => {
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

test("advanced get & eval", t => {
  const vars = _vars({
    a: "Hello",
    b: {
      c: "world",
      d: [1, 2, {e: "test"}]
    },
    f: {
      g: {
        h: {
          i: {
            j: {
              k: "K",
              l: "L"
            }
          }
        }
      }
    },
    m: "${f}"
  });

  vars.get("a").then(value => {
    t.equal(value, "Hello");
    t.equal(vars._context.a, "Hello", "check if the node was replaced");
  }).then(() => {
    return vars.get("b.c").then(value => {
      t.equal(value, "world");
    });
  }).then(() => {
    return vars.get("b.d.2.e").then(value => {
      t.equal(value, "test");
    });
  }).then(() => {
    return vars.get("b.d").then(value => {
      t.deepEqual(value, [1, 2, {e: "test"}]);
    });
  }).then(() => {
    return vars.get("f").then(value => {
      t.deepEqual(value, {g:{h:{i:{j:{k:"K", l:"L"}}}}});
      t.equal(vars._context.f.constructor.name, "Object");
    });
  }).then(() => {
    return vars.get("m").then(value => {
      t.deepEqual(value, {g:{h:{i:{j:{k:"K", l:"L"}}}}});
      t.equal(vars._context.m.constructor.name, "VarNode", "check if the node is not replaced");
    });
  }).then(() => {
    return vars.eval("#${b.d.0}").then(value => {
      t.equal(value, "#1");
    });
  }).then(() => {
    return vars.eval("#${b.d.2}").then(() => {
      t.fail();
    }).catch(err => {
      t.equal(err.code, "NON_STRING_MIX");
    });
  }).then(() => t.end(), t.end);
});

test("nested vars & literals", t => {
  const vars = _vars({
    a: "c",
    b: "${${a}}",
    c: "OK",
    d: "** \\${a} ${b} \\${z} **",
    e: "${d}",
    f: "\\${a}"
  });

  vars.get("b").then(value => {
    t.equal(value, "OK", "nested");
  }).then(() => {
    return vars.get("f").then(value => {
      t.equal(value, "${a}", "literal");
    });
  }).then(() => {
    return vars.get("d").then(value => {
      t.equal(value, "** ${a} OK ${z} **", "literal mix");
    });
  }).then(() => {
    return vars.get("e").then(value => {
      t.equal(value, "** ${a} OK ${z} **", "literal - indirect");
    });
  }).then(() => t.end(), t.end);
});

test("circular reference && strict access mode", t => {
  const vars = _vars({
    a: "${b}",
    b: "${c.d}",
    c: {
      d: "${a}"
    },
    e: {
      f: {
        g: "${c}",
        h: "good!"
      }
    }
  });

  vars.get("a").then(value => {
    t.equal(value, "!!CIRCULAR_REF!!", "circular ref");
  }).then(() => {
    return vars.get("e").then(value => {
      t.deepEqual(value, {
        f: {
          g: {
            d: "!!CIRCULAR_REF!!"
          },
          h: "good!"
        }
      }, "circular ref in object");
    });
  }).then(() => {
    return vars.get("a", {strictCircular: true}).then(() => {
      t.fail();
    }).catch(err => {
      t.equal(err.code, "CIRCULAR_VAR_REF");
    });
  }).then(() => {
    return vars.get("e.x.y.z").then(value => {
      t.equal(value, undefined, "non-existent property");
    });
  }).then(() => {
    return vars.get("e.x.y.z", {strict: true}).then(() => {
      t.fail();
    }).catch(err => {
      t.equal(err.code, "PROPERTY_NOT_FOUND");
    });
  }).then(() => t.end(), t.end);
});

// * get function
// * non string value
// * mixed value error
// * circular ref
// * node replacement
// * options: strict, force, strictCircular
// file source
// env source
// opt source
