"use strict";

const express = require("express");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

const args = serverArgs({workDir: __dirname + "/.."});
const app = express();

function fetchInitialState() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        todos: [{
          id: 1,
          text: "Buy a pack of milk",
          completed: true
        }, {
          id: 2,
          text: "Finish the documentation",
          completed: false
        }]
      });
    }, 10);
  });
};

app.use(gourmet.middleware(args));

app.get("/", (req, res, next) => {
  fetchInitialState().then(reduxState => {
    res.serve("main", {reduxState});
  }).catch(next);
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
});
