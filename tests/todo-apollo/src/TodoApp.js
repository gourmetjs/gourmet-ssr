import React, {Component} from "react";
import TodoLoadable from "./TodoLoadable";

export default class TodoApp extends Component {
  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoLoadable/>
      </div>
    );
  }
}
