import React from "react";
import {BrowserRouter} from "react-router-dom";
import MainPage from "./MainPage";

export default function render(gmctx) {
  return (
    <BrowserRouter>
      <MainPage gmctx={gmctx}/>
    </BrowserRouter>
  );
}
