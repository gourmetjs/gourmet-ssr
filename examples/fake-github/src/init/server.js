import emotionRenderer from "@gourmet/emotion-renderer/server";
import prepare from "react-prepare";
import renderRoot from "../containers/renderRoot";

__gourmet_module__.exports = emotionRenderer(gmctx => {
  if (STAGE !== "hot") {
    return Promise.resolve().then(() => {
      return renderRoot(gmctx);
    }).then(element => {
      return prepare(element).then(() => element);
    });
  } else {
    return null;
  }
});
