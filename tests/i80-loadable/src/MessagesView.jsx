import React from "react";
import loadable from "@gourmet/react-loadable";

export default class MessagesView extends React.Component {
  static routeLoadable = loadable({
    loader: () => import(/* webpackChunkName: "messages" */ "./MessagesPanel")
  });

  render() {
    return <MessagesView.routeLoadable {...this.props}/>;
  }
}
