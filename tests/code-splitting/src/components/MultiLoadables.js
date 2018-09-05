import React from "react";
import loadable from "@gourmet/react-loadable";

export const ComponentA = loadable({
  loader: () => import("./MessageBox"),
  render(loaded, props) {
    return <loaded.default {...props} message="Component A"/>;
  },
  signature: "a"
});

export const ComponentB = loadable({
  loader: () => import("./MessageBox"),
  render(loaded, props) {
    return <loaded.default {...props} message="Component B" type="success"/>;
  },
  signature: "b"
});
