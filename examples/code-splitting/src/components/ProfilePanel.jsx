import React from "react";
import {hot} from "react-hot-loader";
import PhotoLoadable from "./PhotoLoadable";

function ProfilePanel() {
  return (
    <div>
      <h1>Panel: Profile</h1>
      <PhotoLoadable/>
    </div>
  );
}

export default hot(module)(ProfilePanel);
