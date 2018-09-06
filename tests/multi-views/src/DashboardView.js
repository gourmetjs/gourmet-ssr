import React from "react";
import renderProps from "./renderProps";

export default class DashboardView extends React.Component {
  static getInitialProps(props) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardView_getInitialProps: true});
      }, 10);
    });
  }

  static makeProps(gmctx) {
    return Object.assign(gmctx.renderer.makeProps(gmctx), {makeProps: true});
  }

  render() {
    return (
      <div>
        <h1>Dashboard</h1>
        <pre>
          {renderProps(this.props)}
        </pre>
      </div>
    );
  }
}
