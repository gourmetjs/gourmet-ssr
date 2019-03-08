"use strict";

const {DataSource} = require("apollo-datasource");

const _todos = [
  "Buy a pack of milk",
  "Finish the documentation"
];

module.exports = class TodoData extends DataSource {
  initialize(config) {
    this.context = config.context;
  }

  getAll() {
    return _todos.slice();  // make a shallow copy
  }

  addTodo(text) {
    _todos.push(text);
    return text;
  }
};
