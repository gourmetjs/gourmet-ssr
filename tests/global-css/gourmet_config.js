"use strict";

module.exports = {
  pages: {
    main: "./src/hello.js"
  },
  webpack: {
    config: {
      externals: {
        "jquery": "jQuery"
      }
    }
  }
};
