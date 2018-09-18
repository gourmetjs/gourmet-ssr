import React from "react";

export default function ProfilePanel(props) {
  // throw Error("fixme");
  // Exception here causes React's error boundary warning on client side,
  // process exit on the server side.
  return <h1>{props.label} {props.activeRoute.getDisplayName()}</h1>;
}
