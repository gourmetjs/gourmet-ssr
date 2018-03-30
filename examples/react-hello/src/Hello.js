import "bootstrap/dist/css/bootstrap.min.css";
import React, {PureComponent} from "react";
import {hot} from "react-hot-loader";

class Hello extends PureComponent {
  render() {
    return (
      <div>
        Hello, world!
      </div>
    );
  }
}

export default hot(module)(Hello);
