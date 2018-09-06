import React from "react";
import renderProps from "./renderProps";

export default class DashboardView extends React.Component {
  static getInitialProps(gmctx) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardView_getInitialProps: true});
      }, 10);
    });
  }

  static makeRouteProps(gmctx) {
    return Object.assign(gmctx.renderer.makeRouteProps(gmctx), {DashboardView_makeRouteProps: true});
  }

  render() {
    return (
      <pre>
        {renderProps("Route props", this.props)}
      </pre>
    );
  }
}
