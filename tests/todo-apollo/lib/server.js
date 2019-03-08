"use strict";

const express = require("express");
const morgan = require("morgan");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");
const {ApolloServer} = require("apollo-server-express");
const schema = require("./schema");
const TodoData = require("./TodoData");
const resolvers = require("./resolvers");

const args = serverArgs({
  workDir: __dirname + "/..",
  outputDir: "../../.gourmet/todo-apollo"
});
const app = express();

const apollo = new ApolloServer({
  typeDefs: schema,
  dataSources() {
    return {todoData: new TodoData()};
  },
  resolvers
});

app.use(morgan("dev"));

apollo.applyMiddleware({app});

app.use(gourmet.middleware(args));

app.get("/", (req, res) => {
  res.serve("main");
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
  console.info(`GraphQL path is ${apollo.graphqlPath}`);
});
