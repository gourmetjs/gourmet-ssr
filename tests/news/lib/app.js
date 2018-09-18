"use strict";

const got = require("got");
const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

const API_URL = "https://newsapi.org/v2/everything";
const API_KEY = process.env.NEWS_API_KEY || "154b5ab8953e468eb882083b815c65fb";

module.exports = function(def) {
  const args = serverArgs(def);
  const app = express();

  if (args.debug)
    app.use(morgan("dev"));

  app.use(gourmet.middleware(args));

  app.get("/api/news", (req, res, next) => {
    const language = req.query.language || "en";
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 20;
    const sources = req.query.sources || "cnn,bbc-news,business-insider,the-new-york-times";

    got(API_URL, {
      json: true,
      query: {
        language,
        sources,
        page,
        pageSize,
        apiKey: API_KEY
      }
    }).then(response => {
      res.json(response.body);
    }).catch(next);
  });

  app.get("*", (req, res) => {
    res.serve("main");
  });

  app.use(gourmet.errorMiddleware());

  app.server = app.listen(args.port, () => {
    if (args.debug)
      console.log(`Server is listening on port ${args.port}...`);
  });

  return app;
};
