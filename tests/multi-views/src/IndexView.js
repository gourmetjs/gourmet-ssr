import React from "react";
import renderProps from "./renderProps";

export default class IndexView extends React.Component {
  static getInitialProps(gmctx) {
    gmctx.setHead(<title>IndexView</title>);
    return {IndexView_getInitialProps: true};
  }

  render() {
    return (
      <pre id="route_props">
        {renderProps("Route props", this.props)}
      </pre>
    );
  }
}
