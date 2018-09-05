import React from "react";

export default function MessagesPanel(props) {
  return <h1>{props.label} {props.route.getDisplayName()}</h1>;
}
