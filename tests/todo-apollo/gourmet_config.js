module.exports = {
  pages: {
    main: "./src/TodoApp.js"
  },

  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/todo-apollo",
    contentHash: context => context.stage === "ltc"
  },

  apollo: {
    linkHttp: {
      uri: "/custom-graphql"
    }
  },

  config: {
    html: {
      headTop: [
        '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">'
      ]
    }
  }
};
