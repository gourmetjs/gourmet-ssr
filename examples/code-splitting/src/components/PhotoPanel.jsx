import React from "react";
import {hot} from "react-hot-loader";
import earth from "../images/earth.png";

function PhotoPanel() {
  return <img src={earth} className="img-thumbnail rounded"/>;
}

export default hot(module)(PhotoPanel);
