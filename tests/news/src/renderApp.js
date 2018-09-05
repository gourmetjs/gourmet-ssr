import React from "react";
import NewsApp from "./NewsApp";

export default function renderApp(NewsData, gmctx) {
  const newsData = new NewsData(gmctx);
  return newsData.prepare().then(() => {
    return <NewsApp newsData={newsData}/>;
  });
}
