"use strict";

module.exports = {
  pages: {
    main: "./src/main"
  },

  builder: {
    installSourceMapSupport: false,

    moduleLinks: {
      "domready": "client",
      "classnames": "server",
      "mkdirp": "external",
      "none": false
    }
  }
};
