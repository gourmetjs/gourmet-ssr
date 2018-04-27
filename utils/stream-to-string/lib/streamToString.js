"use strict";

const eos = require("end-of-stream");
const destroy = require("destroy");

module.exports = function(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    stream.on("data", chunk => {
      chunks.push(chunk.toString());
    });

    eos(stream, err => {
      if (err)
        reject(err);
      else
        resolve(chunks.join(""));
      destroy(stream);
    });
  });
};
