import React from "react";
import PhotoLoadable from "./PhotoLoadable";

export default function ProfilePanel(props) {
  return (
    <div>
      <h1>{props.label} Profile</h1>
      <PhotoLoadable/>
    </div>
  );
}
