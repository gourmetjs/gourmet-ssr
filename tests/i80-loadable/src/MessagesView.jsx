import React from "react";
import loadable from "@gourmet/react-loadable";

export default class MessagesView extends React.Component {
  static routeLoadable = loadable({
    loader() {
      return import(/* webpackChunkName: "messages" */ "./MessagesPanel");
    }
  });

  render() {
    return <MessagesView.routeLoadable {...this.props}/>;
  }
}
