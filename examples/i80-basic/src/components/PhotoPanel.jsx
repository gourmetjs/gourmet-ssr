import React from "react";
import {ComponentA, ComponentB} from "./MultiLoadables";
import earth from "../images/earth.png";

export default function PhotoPanel() {

  return (
    <div>
      <img src={earth} className="img-thumbnail rounded"/>
      <ComponentA message="This is a loadable component A"/>
      <ComponentB message="This is a loadable component B"/>
    </div>
  );
}
