import React from "react";

export default class DashboardPage extends React.Component {
  // This gets called when the renderer needs to render a root React component
  // to provide an opportunity to customize the rendering process.
  // `props` is the result of `makeProps()` static function.
  // You can return a promise.
  static renderPage(props) {
    return <DashboardPage renderPage={true} {...props}/>;
  }

  // This gets called to construct `props` for `renderPage()`.
  // Caller's initial properties are provided in `gmctx.initialProps`.
  static makeProps(gmctx) {
    return Object.assign(gmctx.renderer.makeProps(gmctx), {makeProps: true});
  }

  // This gets called only once on the server side and returned object
  // is serialized and used on the client side.
  static getInitialProps(props) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardPage_getInitialProps: true});
      }, 10);
    });
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
      return `  ${name}: ${value}\n`;
    });
  }
}
