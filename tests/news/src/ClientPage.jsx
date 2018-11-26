import React from "react";
import NewsDataClient from "@gourmet/test-news-view/gmsrc/NewsDataClient";
import NewsApp from "./NewsApp";

export default class ClientPage {
  static renderPage(props) {
    const newsData = new NewsDataClient(props.gmctx);
    return newsData.prepare().then(() => {
      return <NewsApp newsData={newsData}/>;
    });
  }
}
