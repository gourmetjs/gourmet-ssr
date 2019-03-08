import React from "react";
import renderProps from "./renderProps";

export default class DashboardView extends React.Component {
  static getInitialProps(gmctx) {
    gmctx.setHead(<title>DashboardView</title>);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardView_getInitialProps: true});
      }, 10);
    });
  }

  render() {
    return (
      <pre id="route_props">
        {renderProps("Route props", this.props)}
      </pre>
    );
  }
}
