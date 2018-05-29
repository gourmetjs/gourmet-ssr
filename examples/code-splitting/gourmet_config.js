"use strict";

module.exports = {
  entry: {
    main: "./src/main/${context:target}.js",
    admin: ["./src/admin/init.js", "./src/admin/${context:target}.js"]
  },
  webpack: {
    pipelines: {
      js: [{
        name: "#babel-loader",
        options: {
          plugins: [{
            name: "@gourmet/babel-plugin-gourmet-loadable",
            plugin: require.resolve("@gourmet/babel-plugin-gourmet-loadable")
          }]
        }
      }]
    }
  },
  /*
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
    },
    plugins: [{
      name: "react-loadable/webpack",
      plugin: require("react-loadable/webpack").ReactLoadablePlugin,
      options: {
        filename: "./_dist/react-loadable-${context:target}-manifest.json"
      }
    }]
  },
  */
  config: {
    html: {
      headTop: [
        '<link href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">'
      ]
    }
  }
};
