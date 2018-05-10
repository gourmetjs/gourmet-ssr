import emotionRenderer from "@gourmet/emotion-renderer";
import NewsDataClient from "@gourmet/example-news-view/src/NewsDataClient";
import renderApp from "./renderApp";

emotionRenderer(renderApp.bind(null, NewsDataClient)).render();
