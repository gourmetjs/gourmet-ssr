import React from "react";
import i80 from "@gourmet/react-i80";
import MainPage from "./MainPage";
import routes from "./routes";

i80(routes);   // install the main routes

export default function render() {
  return <MainPage/>;
}
