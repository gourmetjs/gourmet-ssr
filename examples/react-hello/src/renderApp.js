import React, {PureComponent} from "react";
import {hot} from "react-hot-loader";
import Timer from "./Timer";

class Hello extends PureComponent {
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

const HelloApp = hot(module)(Hello);

export default function renderApp() {
  return <HelloApp/>;
}
