import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer";
import MainPage from "./MainPage";

import {BrowserRouter} from "react-router-dom";

function reactRouterClient(render) {
  return function renderClient(gmctx) {
    return (
      <BrowserRouter>
        {render(gmctx)}
      </BrowserRouter>
    );
  };
}

emotionRenderer(reactRouterClient(gmctx => <MainPage gmctx={gmctx}/>)).render();
