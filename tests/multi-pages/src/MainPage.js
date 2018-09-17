import React from "react";
import renderProps from "./renderProps";

export default class MainPage extends React.Component {
  static getInitialProps() {
    throw Error("haha");
    return {MainPage_getInitialProps: true};
  }

  render() {
    return (
      <div>
        <h1>Index</h1>
        <p>{this.props.greeting}</p>
        <pre>
          {renderProps(this.props)}
        </pre>
      </div>
    );
  }
}
