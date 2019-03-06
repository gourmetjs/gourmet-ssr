import React from "react";
import loadable from "@gourmet/react-loadable";

export default class ProfileView extends React.Component {
  static routeLoadable = loadable({
    loader: function() {
      return import(/* webpackChunkName: "profile" */ "./ProfilePanel");
    }
  });

  render() {
    return <ProfileView.routeLoadable {...this.props}/>;
  }
}
