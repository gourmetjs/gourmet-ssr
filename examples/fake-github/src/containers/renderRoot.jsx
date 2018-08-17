import React from "react";
import HelloRoot from "./HelloRoot";

export default function renderRoot(gmctx) {
  const element = <HelloRoot gmctx={gmctx}/>;
  if (SERVER) {
    const prepare = require("react-prepare").default;
    return prepare(element).then(() => element);
  }
  return element;
}
