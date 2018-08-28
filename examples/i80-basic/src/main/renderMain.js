import React from "react";
import i80 from "@gourmet/react-i80";
import MainPage from "./MainPage";
import routes from "./routes";

i80(routes, {
  basePath: "/",
  caseSensitive: false,  // default is true
  strictSlash: true,     // default is false
  captureClick: true,  // default is true
  fallthrough: true    // default is true
});   // install the main routes

export default function render() {
  return <MainPage/>;
}
