import React from "react";

export default class MessagesView extends React.Component {
  static routeDisplayName = "Messages";

  render() {
    return <h1>{this.props.label} {this.props.route.getDisplayName()}</h1>;
  }
}
