import React from "react";
import {connect} from "react-redux";
import {addTodo} from "../actions";

const AddTodo = ({dispatch}) => {
  let input;

  return (
    <div>
      <form onSubmit={e => {
        e.preventDefault()
        if (!input.value.trim()) {
          return;
        }
        dispatch(addTodo(input.value));
        input.value = "";
      }}>
        <input id="add_todo" ref={node => input = node}/>
        <button id="add_button" type="submit">
          Add Todo
        </button>
      </form>
    </div>
  );
};

export default connect()(AddTodo);
