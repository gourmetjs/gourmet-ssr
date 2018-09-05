import React from "react";

export default class DashboardView extends React.Component {
  // Unlike a page's `getInitialProps()`, a route view's `getInitialProps()`
  // may get called on the client side if a route change occurs on the client.
  // For the initial route's `getInitialProps()`, behavior is same as a page's
  // `getInitialProps()` which gets called only once on the server side and
  // returned object is serialized and used on the client side.
  static getInitialProps(props) {   // eslint-disable-line no-unused-vars
    return {DashboardView_getInitialProps: true};
  }

  render() {
    return (
      <div>
        <h1>Dashboard</h1>
        <pre>
          {this._renderProps(this.props)}
        </pre>
      </div>
    );
  }

  _renderProps(props) {
    return Object.keys(props).sort().map(name => {
      let value = props[name];
      if (name === "gmctx")
        value = "{...}";
      else
        value = JSON.stringify(value);
      return `  ${name}: ${value}`;
    });
  }
}
