"use strict";

module.exports = {
  entry: {
    main: "./src/main/${context:target}.js",
    admin: "./src/admin/${context:target}.js"
  },
  webpack: {
    pipelines: {
      js: [{
        name: "#babel-loader",
        options: {
          plugins: [{
            name: "react-loadable/babel"
          }]
        }
      }]
    }
  },
  config: {
    html: {
      headTop: [
        '<link href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">'
      ]
    }
  }
};
