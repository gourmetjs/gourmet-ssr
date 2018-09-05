import React from "react";
import {StaticRouter} from "react-router";
import MainPage from "./MainPage";

export default function render(gmctx) {
  const rrctx = {};
  return (
    <StaticRouter location={gmctx.url} context={rrctx}>
      <MainPage gmctx={gmctx}/>
    </StaticRouter>
  );
}
