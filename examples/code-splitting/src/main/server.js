import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer/server";
import MainPage from "./MainPage";

import {StaticRouter} from "react-router";

function reactRouterServer(render) {
  return function renderServer(gmctx) {
    const rrctx = {};
    return (
      <StaticRouter location={gmctx.url} context={rrctx}>
        {render(gmctx)}
      </StaticRouter>
    );
  };
}

__gourmet_module__.exports = emotionRenderer(reactRouterServer(gmctx => <MainPage gmctx={gmctx}/>));
