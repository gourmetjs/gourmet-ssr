import React from "react";
import EmotionServerRenderer from "@gourmet/emotion-renderer/lib/EmotionServerRenderer";
import MainPage from "./MainPage";
import Loadable from "react-loadable";

class LoadableServerRenderer extends EmotionServerRenderer {
  getBodyTail(gmctx) {
    const tail = super.getBodyTail(gmctx);
    console.log("modules:", gmctx._loadable.modules);
    return tail;
  }
}

function renderer(render, options) {
  const r = new LoadableServerRenderer(render, options);
  return r.getRenderer.bind(r);
}

__gourmet_module__.exports = renderer(gmctx => {
  gmctx._loadable = {
    modules: []
  };
  return Loadable.preloadAll().then(() => {
    return (
      <Loadable.Capture report={moduleName => gmctx._loadable.modules.push(moduleName)}>
        <MainPage gmctx={gmctx}/>
      </Loadable.Capture>
    );
  });
});
