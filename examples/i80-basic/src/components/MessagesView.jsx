import React from "react";

function MessagesView(props) {
  return <h1>{props.label} {props.route.getDisplayName()}</h1>;
}

MessagesView.routeDisplayName = "Messages";

export default MessagesView;
