"use strict";

module.exports = {
  builder: {
    initOptions: {
      dataPropertyName: "__INIT_DATA__"
    },
    moduleLinks: {
      "react": "client:external",
      "react-dom/server": "external"
    }
  },
  pages: {
    main: "./src/HelloApp.jsx"
  }
};
