import React, {PureComponent} from "react";
import Timer from "./Timer";

export default class HelloApp extends PureComponent {
  static getInitialProps(gmctx) {
    gmctx.setHead(
      <link
        href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css"
        rel="stylesheet"
        integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4"
        crossOrigin="anonymous"
      />,
      <title>React Hello</title>
    );
  }

  message = "Hello";
  
  render() {
    return (
      <div className="container">
        <div className="alert alert-primary">
          <h1>Hello, world!</h1>
          <Timer/>
        </div>
      </div>
    );
  }
}
