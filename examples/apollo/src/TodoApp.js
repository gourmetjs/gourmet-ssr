import React, {Component} from "react";
import TodoMain from "./TodoMain";

export default class TodoApp extends Component {
  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoMain/>
      </div>
    );
  }
}
