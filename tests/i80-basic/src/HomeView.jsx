import React from "react";

export default class HomeView extends React.Component {
  static routeDisplayName = "Home";

  render() {
    return <h1>{this.props.label} {this.props.activeRoute.getDisplayName()}</h1>;
  }
}
