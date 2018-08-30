import React from "react";

export default function ProfilePanel(props) {
  return <h1>{props.label} {props.route.getDisplayName()}</h1>;
}
