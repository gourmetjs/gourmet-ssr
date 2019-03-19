"use strict";

const {gql} = require("apollo-server-express");

const schema = gql`
type Query {
  todos: [String]!
}

type Mutation {
  addTodo(text: String!): String!
}
`;

module.exports = schema;
