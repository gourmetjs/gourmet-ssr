import React from "react";

export default class ServerError extends React.Component {
  render() {
    if (SERVER)
      throw Error("server error");
    return (
      <div>
        Hello, world!
      </div>
    );
  }
}
