import React from "react";
import renderProps from "./renderProps";

export default class DashboardPage extends React.Component {
  // This gets called only once on the server side and returned object
  // is serialized and used on the client side.
  static getInitialProps(props) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardPage_getInitialProps: true});
      }, 10);
    });
  }

  // This gets called to construct `props` for `renderPage()`.
  // Caller's initial properties are provided in `gmctx.initialProps`.
  static makeProps(gmctx) {
    return Object.assign(gmctx.renderer.makeProps(gmctx), {makeProps: true});
  }

  // This gets called when the renderer needs to render a root React component
  // to provide an opportunity to customize the rendering process.
  // `props` is the result of `makeProps()` static function.
  // You can return a promise.
  static renderPage(props) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(<DashboardPage renderPage={true} {...props}/>);
      }, 10);
    });
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
