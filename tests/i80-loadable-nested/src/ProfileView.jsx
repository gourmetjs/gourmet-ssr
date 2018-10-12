"use strict";

const React = require("react");
const loadable = require("@gourmet/react-loadable");
const CustomLoading = require("./CustomLoading").default;

module.exports = class ProfileView extends React.Component {
  static routeDisplayName = "Profile";

  static routeLoadable = loadable({
    loader: () => import("./ProfilePanel"),
    loading: CustomLoading
  });

  render() {
    return <ProfileView.routeLoadable {...this.props}/>;
  }
};
