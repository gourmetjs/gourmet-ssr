module.exports = {
  pages: {
    main: "./src/containers/Root.js"
  },

  builder: {
    stageTypes: {
      "production": ["prod", "ltc"]
    },
    outputDir: "../../.gourmet/todo-redux",
    contentHash: context => context.stage === "ltc"
  }
};
