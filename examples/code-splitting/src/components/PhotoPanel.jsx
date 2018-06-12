import React from "react";
import {hot} from "react-hot-loader";
import {ComponentA, ComponentB} from "./MultiLoadables";
import earth from "../images/earth.png";

function PhotoPanel() {

  return (
    <div>
      <img src={earth} className="img-thumbnail rounded"/>
      <ComponentA message="This is a loadable component A"/>
      <ComponentB message="This is a loadable component B"/>
    </div>
  );
}

export default hot(module)(PhotoPanel);
