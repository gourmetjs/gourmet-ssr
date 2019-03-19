"use strict";

module.exports = {
  Query: {
    todos(_, __, {dataSources}) {
      return dataSources.todoData.getAll();
    }
  },

  Mutation: {
    addTodo(_, {text}, {dataSources}) {
      return dataSources.todoData.addTodo(text);
    }
  }
};
