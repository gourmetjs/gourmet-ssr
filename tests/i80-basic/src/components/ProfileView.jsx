import React from "react";

export default class ProfileView extends React.Component {
  static routeDisplayName = "Profile";

  render() {
    return <h1>{this.props.label} {this.props.route.getDisplayName()}</h1>;
  }
}
