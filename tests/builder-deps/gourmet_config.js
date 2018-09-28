"use strict";

module.exports = {
  pages: {
    main: "./src/main"
  },

  builder: {
    installSourceMapSupport: false,

    moduleLinks: {
      "domready": "client",
      "rimraf": "server",
      "classnames": "client:external",
      "mkdirp": "external",
      "none": false
    }
  }
};
