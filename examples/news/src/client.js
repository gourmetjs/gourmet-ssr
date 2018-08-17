import NewsDataClient from "@gourmet/example-news-view/src/NewsDataClient";
import renderApp from "./renderApp";

export default function render(gmctx) {
  return renderApp(NewsDataClient, gmctx);
}
