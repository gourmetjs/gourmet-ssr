import emotionRenderer from "@gourmet/emotion-renderer/server";
import NewsDataServer from "@gourmet/example-news-view/src/NewsDataServer";
import renderApp from "./renderApp";

__gourmet_module__.exports = emotionRenderer(renderApp.bind(null, NewsDataServer));
