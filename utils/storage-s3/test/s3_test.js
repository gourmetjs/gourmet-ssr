"use strict";

const nstream = require("stream");
const AWS = require("aws-sdk");
const repeat = require("@gourmet/promise-repeat");
const queue = require("@gourmet/promise-queue");
const test = require("tape");
const StorageS3 = require("..");

const TEST_BUCKET = "storage-s3-test-15babd51cf9";
const TEST_REGION = "us-west-2";

const s3 = new AWS.S3({region: TEST_REGION});

let storage;

if (process.env.NET_TEST) {
  test("createBucket", t => {
    s3.createBucket({
      Bucket: TEST_BUCKET
    }).promise().catch(err => {
      if (err.code !== "BucketAlreadyOwnedByYou")
        throw err;
    }).then(() => {
      storage = StorageS3.create({
        bucket: TEST_BUCKET,
        basePath: "/foo",
        aws: {serviceInstances: {s3}}
      });
    }).then(() => t.end(), t.end);
  });

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

  test("listFiles - merging results", t => {
    const count = 15;
    const names = Array.apply(null, Array(count)).map((item, idx) => "file-" + ("0000" + idx).substr(-4));
    queue({data: names}).run(name => {
      return storage.writeFile("max/" + name, name);
    }).then(() => {
      return storage.listFiles("max", {chunkSize:10}).then(files => {
        t.equal(files.length, count, "listFiles should merge multiple results into one array");
        files.sort((f1, f2) => {
          if (f1.name < f2.name)
            return -1;
          else if (f1.name > f2.name)
            return 1;
          else
            return 0;
        });
        files.forEach((file, idx) => {
          const name = "file-" + ("0000" + idx).substr(-4);
          t.equal(file.name, name);
        });
      });
    }).then(() => t.end(), t.end);
  });

  test("rename - basic", t => {
    const oldPath = "max/file-0000";
    const newPath = "renamed/a/b/c/bar.txt";
    storage.rename(oldPath, newPath).then(() => {
      return storage.readFile(newPath).then(data => {
        t.equal(data.toString(), "file-0000");
        return storage.exists(oldPath).then(yes => {
          t.equal(yes, false);
        });
      });
    }).then(() => t.end(), t.end);
  });

  test("rename - overwriting", t => {
    const oldPath = "max/file-0001";
    const newPath = "renamed/a/b/c/bar.txt";
    storage.rename(oldPath, newPath).then(() => {
      return storage.readFile(newPath).then(data => {
        t.equal(data.toString(), "file-0001");
        return storage.exists(oldPath).then(yes => {
          t.equal(yes, false);
        });
      });
    }).then(() => t.end(), t.end);
  });

  test("deleteBucket", t => {
    repeat(() => {
      return s3.listObjectsV2({
        Bucket: TEST_BUCKET
      }).promise().then(data => {
        const items = data.Contents.map(item => ({Key: item.Key}));
        if (items.length) {
          return s3.deleteObjects({
            Bucket: TEST_BUCKET,
            Delete: {Objects: items}
          }).promise().then(() => {});
        } else {
          return true;
        }
      });
    }).then(() => {
      return s3.deleteBucket({
        Bucket: TEST_BUCKET
      }).promise();
    }).then(() => t.end(), t.end);
  });
}
