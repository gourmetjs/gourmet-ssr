"use strict";

const express = require("express");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");
const con = require("@gourmet/console")();
const {ApolloServer} = require("apollo-server-express");
const schema = require("./schema");
const TodoData = require("./TodoData");
const resolvers = require("./resolvers");

const args = serverArgs({workDir: __dirname + "/.."});
const app = express();

const apollo = new ApolloServer({
  typeDefs: schema,
  dataSources() {
    return {todoData: new TodoData()};
  },
  resolvers
});

apollo.applyMiddleware({app});

app.use(gourmet.middleware(args));

app.get("/", (req, res) => {
  res.serve("main");
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  con.log(`Server is listening on port ${args.port}...`);
  con.info(`GraphQL path is ${apollo.graphqlPath}`);
});
