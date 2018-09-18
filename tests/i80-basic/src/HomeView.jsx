import React from "react";

export default class HomeView extends React.Component {
  static routeDisplayName = "Home";

  render() {
    // throw Error("fixme");
    // Exception here exit the process
    return <h1>{this.props.label} {this.props.activeRoute.getDisplayName()}</h1>;
  }
}
