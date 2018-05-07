import emotionRenderer from "@gourmet/emotion-renderer/server";
import renderApp from "./renderApp";
import NewsDataServer from "./NewsDataServer";

__gourmet_module__.exports = emotionRenderer(renderApp.bind(null, NewsDataServer));
