"use strict";

const {gql} = require("apollo-server-express");

module.exports = gql`
type Query {
  todos: [String]!
}

type Mutation {
  addTodo(text: String!): String!
}
`;
