# @gourmet/promise-create-write-stream

Creates a writable file stream and returns a promise that is fulfilled when the writing is finished and the file is closed.

# Basic usage

```js
promiseCreateWriteStream(path, callback, options)
```

- `callback(ws)` is invoked when the stream is ready for writing.
- Automatically creates the intermediate directories *ONLY* if a first trial
  of creating the file fails for the efficiency.
- Writes to a temporary file ("{path}.saving") and renames when done.

 Options in addition to `fs.createWriteStream` are:
  - useOriginalPath: Don't use a temporary path. (Default: false)
  - dontMakeDirs: Don't make a intermediate directories. (Default: false)
  - mkdirMode: See `fs.mkdir()`. (Default: 0777)

 Because this function renames the file after the writing is complete,
 you should not depend on "finish" event of the stream for detecting the
 end of a whole writing task. Use the returned promise instead.
