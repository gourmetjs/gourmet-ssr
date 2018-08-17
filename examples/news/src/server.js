import NewsDataServer from "@gourmet/example-news-view/src/NewsDataServer";
import renderApp from "./renderApp";

export default function render(gmctx) {
  return renderApp(NewsDataServer, gmctx);
}
