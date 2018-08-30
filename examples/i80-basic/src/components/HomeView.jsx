import React from "react";

function HomeView(props) {
  return <h1>{props.label} {props.route.getDisplayName()}</h1>;
}

HomeView.routeDisplayName = "Home";

export default HomeView;
