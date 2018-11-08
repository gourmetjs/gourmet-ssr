"use strict";

const WEBPACK = "webpack:///";

require("source-map-support").install({
  environment: "node",
  supportRelativeURL: (file, url) => {
    if (url.startsWith(WEBPACK))
      return url.substr(WEBPACK.length);
  }
});
