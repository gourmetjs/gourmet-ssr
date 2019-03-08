import React from "react";
import renderProps from "./renderProps";

function getRenderer(Base) {
  return class CustomRenderer extends Base {
    makePageProps(gmctx) {
      return Object.assign(super.makePageProps(gmctx), {DashboardPage_makePageProps: true});
    }

    createPageElement(gmctx, type, props) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(super.createPageElement(gmctx, type, Object.assign(props, {DashboardPage_createPageElement: true})));
        }, 10);
      });
    }
  };
}

export default class DashboardPage extends React.Component {
  static getInitialProps(gmctx) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardPage_getInitialProps: true});
      }, 10);
    });
  }

  static getServerRenderer = getRenderer;
  static getClientRenderer = getRenderer;

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
