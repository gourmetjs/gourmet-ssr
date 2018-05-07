import emotionRenderer from "@gourmet/emotion-renderer";
import renderApp from "./renderApp";
import NewsDataClient from "./NewsDataClient";

emotionRenderer(renderApp.bind(null, NewsDataClient)).render();
