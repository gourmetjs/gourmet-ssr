import React from "react";
import renderProps from "./renderProps";

export default class IndexView extends React.Component {
  static getInitialProps() {
    return {IndexView_getInitialProps: true};
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
