import React from "react";
import NewsDataServer from "@gourmet/test-news-view/src/NewsDataServer";
import NewsApp from "./NewsApp";

export default class ServerPage {
  static renderPage(props) {
    const newsData = new NewsDataServer(props.gmctx);
    return newsData.prepare().then(() => {
      return <NewsApp newsData={newsData}/>;
    });
  }
}
