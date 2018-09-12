import React from "react";
import renderProps from "./renderProps";

export default class DashboardPage extends React.Component {
  static getInitialProps(gmctx) {   // eslint-disable-line no-unused-vars
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({DashboardPage_getInitialProps: true});
      }, 10);
    });
  }

  static makePageProps(gmctx) {
    return Object.assign(gmctx.renderer.makePageProps(gmctx), {DashboardPage_makePageProps: true});
  }

  static renderPage(props) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(<DashboardPage DashboardPage_renderPage={true} {...props}/>);
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
