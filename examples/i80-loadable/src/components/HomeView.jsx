import React from "react";
import loadable from "@gourmet/react-loadable";

export default class HomeView extends React.Component {
  static routeDisplayName = "Home";

  static routeLoadable = loadable({
    loader: () => import(/* webpackChunkName: "home" */ "./HomePanel")
  });

  render() {
    return <HomeView.routeLoadable {...this.props}/>;
  }
}
