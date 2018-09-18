import React from "react";
import renderProps from "./renderProps";

export default class MainPage extends React.Component {
  static getInitialProps() {
    return {MainPage_getInitialProps: true};
  }

  render() {
    // throw Error("fixme");
    // Exception thrown here causes "Response headers already sent" but no
    // stack trace in the terminal.
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
