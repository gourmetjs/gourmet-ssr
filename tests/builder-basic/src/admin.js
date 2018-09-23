"use strict";

const print = require("./print").default;
const renderer = require("./renderer").default;

if (SERVER) {
  module.exports = ({page, manifest}) => {
    const render = renderer({page, manifest});
    return ({reqArgs, clientProps}) => {
      return render(
        "** SERVER **",
        `page: ${page}`,
        `stage: ${manifest.stage}`,
        `staticPrefix: ${manifest.staticPrefix}`,
        `reqArgs.url: ${reqArgs.url}`,
        `clientProps: ${JSON.stringify(clientProps)}`
      );
    };
  };
} else {
  print("ADMIN: This is admin page...");
}
