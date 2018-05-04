import emotionRenderer from "@gourmet/emotion-renderer/server";
import renderApp from "./renderApp";

__gourmet_module__.exports = emotionRenderer(renderApp);
