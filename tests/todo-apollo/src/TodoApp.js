import React, {Component} from "react";
import TodoLoadable from "./TodoLoadable";

export default class TodoApp extends Component {
  static createApolloClient(gmctx, options) {
    options.linkHttp.fetch = (url, options) => {
      options.headers["x-gourmet-test-name"] = "@gourmet/test-todo-apollo";
      return fetch(url, options);
    };
  }

  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoLoadable/>
      </div>
    );
  }
}
