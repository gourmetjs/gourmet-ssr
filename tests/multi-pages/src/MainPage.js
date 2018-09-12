import React from "react";
import {hot} from "react-hot-loader";
import renderProps from "./renderProps";

class MainPage extends React.Component {
  static getInitialProps() {
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

export default hot(module)(MainPage);
