import React from "react";
import AddTodo from "../containers/AddTodo";
import VisibleTodoList from "../containers/VisibleTodoList";

const App = () => (
  <div>
    <AddTodo/>
    <VisibleTodoList/>
    <div>
      <br/>
      <a href="/settings">&#x00bb; Settings</a>
    </div>
  </div>
);

export default App;
