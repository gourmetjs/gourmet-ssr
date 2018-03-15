"use strict";

const npath = require("path");
const test = require("tape");
const Variables = require("..");
const Self = require("../lib/sources/Self");
const Env = require("../lib/sources/Env");
const Opt = require("../lib/sources/Opt");
const File = require("../lib/sources/File");

function _vars(obj) {
  const vars = new Variables(obj);
  vars.addSource("self", new Self(vars));
  vars.addSource("env", new Env({NODE_ENV: "production"}));
  vars.addSource("opt", new Opt({"command": "help", verbose: true}));
  vars.addSource("file", new File(vars, npath.join(__dirname, "fixture"), {stage: "prod"}));
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

test("circular reference", t => {
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

  return Promise.resolve().then(() => {
    return vars.get("a").then(() => {
      t.fail();
    }).catch(err => {
      t.equal(err.code, "CIRCULAR_VAR_REF");
      t.equal(err.path, "a");
    });
  }).then(() => {
    return vars.get("e").then(() => {
      t.fail();
    }).catch(err => {
      t.equal(err.code, "CIRCULAR_VAR_REF");
      t.equal(err.path, "e.f.g.d");
    });
  }).then(() => t.end(), t.end);
});

test("non-existent property & default value", t => {
  const vars = _vars({
    a: {
      b: {
        c: "hello"
      }
    },
    d: "${a.b.c, true}",
    e: "${a.x.y.z, 'good'}",
    f: "${a.x.y.z, d}",
    defaultStage: "beta",
    stage: "${opt:stage, env:STAGE, self:defaultStage, 'dev'}",
  });

  return Promise.resolve().then(() => {
    return vars.get("a.x.y.z").then(value => {
      t.equal(value, undefined, "non-existent property");
    });
  }).then(() => {
    return vars.get("d").then(value => {
      t.equal(value, "hello", "default value - not used");
    });
  }).then(() => {
    return vars.get("e").then(value => {
      t.equal(value, "good", "default value - used");
    });
  }).then(() => {
    return vars.get("f").then(value => {
      t.equal(value, "hello", "default value - ref");
    });
  }).then(() => {
    return vars.get("stage").then(value => {
      t.equal(value, "beta", "default value - sequence");
    });
  }).then(() => t.end(), t.end);
});

test("env source", t => {
  const vars = _vars({
    "dataFile": "${env:NODE_ENV, 'dev'}-data.json"
  });

  return Promise.resolve().then(() => {
    return vars.get("dataFile").then(value => {
      t.equal(value, "production-data.json");
    });
  }).then(() => t.end(), t.end);
});

test("opt source", t => {
  const vars = _vars({
    "command": "${opt:command}",
    "verbose": "${opt:verbose}"
  });

  return Promise.resolve().then(() => {
    return vars.get("command").then(value => {
      t.equal(value, "help");
    });
  }).then(() => {
    return vars.get("verbose").then(value => {
      t.equal(value, true);
    });
  }).then(() => t.end(), t.end);
});

test("file source", t => {
  const vars = _vars({
    "config": "${file:./config.json}",
    "message": "${config.a.b.c}, ${config.a.b.d}!",
    "build": "${file:./config.js}"
  });

  return Promise.resolve().then(() => {
    return vars.get("config.a.b.c").then(value => {
      t.equal(value, "Hello");
    });
  }).then(() => {
    return vars.get("message").then(value => {
      t.equal(value, "Hello, world!");
    });
  }).then(() => {
    return vars.eval("${file:./config.json?property=a.b.d}").then(value => {
      t.equal(value, "world", "?property=path.to.prop");
    });
  }).then(() => {
    return vars.eval("${file:./config.json?property=a%3db}").then(value => {
      t.equal(value, "OK", "?property=a%3db");
    });
  }).then(() => {
    return vars.eval("${file:./spaced%20file.json?property=message}").then(value => {
      t.equal(value, "good!", "spaced%20file.json");
    });
  }).then(() => {
    return vars.get("build.minify").then(value => {
      t.equal(value, true);
    });
  }).then(() => t.end(), t.end);
});

// * get function
// * non string value
// * mixed value error
// * circular ref
// * node replacement
// * options: strict, force, strictCircular
// * default value
// * env source
// * opt source
// * file source
// url encoded

//${env:FLAT_NAME}
//${opt:path.to.prop}
//${self:path.to.prop}
//${file:../path/to/file?abc, self:path.to.prop | "string" | 123 | null | true | false}
//${s3:bucket/my/path/to/key}

