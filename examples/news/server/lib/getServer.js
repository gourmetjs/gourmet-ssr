"use strict";

const got = require("got");

const API_URL = "https://newsapi.org/v2/everything";
const API_KEY = process.env.NEWS_API_KEY || "154b5ab8953e468eb882083b815c65fb";

module.exports = function getServer(BaseClass) {
  return class Server extends BaseClass {
    installMiddleware() {
      this.app.get("/api/news", (req, res, next) => {
        const language = req.query.language || "en";
        const page = req.query.page || 1;
        const count = req.query.count || 20;
        const sources = req.query.sources || "cnn,bbc-news,business-insider,the-new-york-times";

        got(API_URL, {
          json: true,
          query: {
            language,
            sources,
            page,
            pageSize: count,
            apiKey: API_KEY
          }
        }).then(response => {
          res.json(response.body);
        }).catch(next);
      });

      super.installMiddleware();
    }
  };
};
