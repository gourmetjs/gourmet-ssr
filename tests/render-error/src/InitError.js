import React from "react";

// Currently, it appears that Puppeteer doesn't support a method to get
// a browser's JS uncaught exception. For this reason, we test the server
// init error only.
if (SERVER)
  throw Error("init server error");

export default class InitClientError extends React.Component {
  render() {
    return (
      <div>
        Hello, world!
      </div>
    );
  }
}
