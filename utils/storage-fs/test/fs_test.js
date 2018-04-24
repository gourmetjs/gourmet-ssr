"use strict";

const npath = require("path");
const nstream = require("stream");
const promiseQueue = require("@gourmet/promise-queue");
const test = require("tape");
const rimraf = require("rimraf");
const StorageFs = require("..");

const TEST_DIR = npath.join(__dirname, ".test");

const storage = new StorageFs({basePath: TEST_DIR});

test("writeFile - hello.text", t => {
  const stream = new nstream.PassThrough();

  storage.writeFile("hello.text", stream).then(() => {
    t.pass("writing to file should be successful");
  }).then(() => t.end(), t.end);

  stream.write("Hello, ");
  stream.end("world!");
});

test("createReadStream - hello.text", t => {
  storage.createReadStream("hello.text").then(stream => {
    let buf = "";
    stream.on("data", data => {
      buf += data.toString();
    });
    stream.on("end", () => {
      t.equal(buf, "Hello, world!", "createReadStream should work");
      t.end();
    });
  }).catch(t.end);
});

test("createReadStream - range", t => {
  storage.createReadStream("hello.text", {start: 2, end: 7}).then(stream => {
    let buf = "";
    stream.on("data", data => {
      buf += data.toString();
    });
    stream.on("end", () => {
      t.equal(buf, "llo, w", "range should work");
      t.end();
    });
  }).catch(t.end);
});

test("createReadStream - nonexistent", t => {
  storage.createReadStream("nonexistent").then(() => {
    t.fail("createReadStream should reject a promise for nonexistent path");
  }).catch(err => {
    t.equal(err.code, "ENOENT", "error code should be ENOENT");
  }).then(() => t.end(), t.end);
});

test("exists - hello.text", t => {
  storage.exists("hello.text").then(yes => {
    t.ok(yes, "exists('hello.text') should be resolved to true");
  }).then(() => t.end(), t.end);
});

test("stat - hello.text", t => {
  storage.stat("hello.text").then(stats => {
    t.equal(stats.size, 13, "stats.size should be 13");
    t.ok(stats.mtime instanceof Date, "stats.mtime should have a Date object");
  }).then(() => t.end(), t.end);
});

test("writeFile - foo.txt", t => {
  const content = "This is a test file!";
  storage.writeFile("foo.txt", content).then(() => {
    return storage.stat("foo.txt").then(stats => {
      t.equal(stats.size, content.length, "writeFile should create a file with length " + content.length);
    });
  }).then(() => t.end(), t.end);
});

test("readFile - foo.txt", t => {
  const content = "This is a test file!";
  storage.readFile("foo.txt").then(data => {
    t.ok(Buffer.isBuffer(data), "data should be a Buffer");
    t.equal(data.toString(), content, "content should match");
  }).then(() => t.end(), t.end);
});

test("readFile - nonexistent", t => {
  storage.readFile("nonexistent").then(() => {
    t.fail("readFile should reject a promise for nonexistent path");
  }).catch(err => {
    t.equal(err.code, "ENOENT", "error code should be ENOENT");
  }).then(() => t.end(), t.end);
});

test("listFiles - basic", t => {
  storage.writeFile("subdir/test.txt", "bar").then(() => {
    return storage.listFiles("/").then(files => {
      t.deepEqual(
        files.map(item => ({name: item.name, size: item.size})),
        [{name: "foo.txt", size: 20}, {name: "hello.text", size: 13}],
        "listFiles should return two known items"
      );
    });
  }).then(() => t.end(), t.end);
});

test("unlink - hello.text", t => {
  storage.unlink("hello.text").then(() => {
    return storage.exists("hello.text").then(yes => {
      t.notOk(yes, "exists('hello.text') should be resolved to false after unlink");
    });
  }).then(() => t.end(), t.end);
});

test("unlink - nonexistent file", t => {
  storage.unlink("nonexistent.txt").then(() => {
    t.pass("unlink should ignore nonexistent file quietly");
  }).then(() => t.end(), t.end);
});

test("listFiles - many items", t => {
  const count = 1500;
  const names = Array.apply(null, Array(count)).map((item, idx) => "file-" + idx);
  return promiseQueue({data: names}).run(name => {
    return storage.writeFile("max/" + name, name);
  }).then(() => {
    return storage.listFiles("max").then(files => {
      t.equal(files.length, count, "listFiles should work on many items");
    });
  }).then(() => t.end(), t.end);
});

test("rimraf", t => {
  rimraf(TEST_DIR, t.end);
});
