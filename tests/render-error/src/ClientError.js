import React from "react";

export default class ClientError extends React.Component {
  render() {
    if (CLIENT)
      throw Error("render client error");
    return (
      <div>
        Hello, world!
      </div>
    );
  }
}
