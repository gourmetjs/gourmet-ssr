import React, {Component} from "react";
import {Query, Mutation} from "react-apollo";
import gql from "graphql-tag";
import { _ } from "core-js";

const GET_TODOS = gql`
query GetTodos {
  todos
}
`;

const ADD_TODO = gql`
mutation AddTodo($text: String!) {
  addTodo(text: $text)
}
`;

export default class TodoMain extends Component {
  state = {
    text: ""
  };

  render() {
    return (
      <div className="border p-3">
        <h3>TODO</h3>
        <Query query={GET_TODOS}>
          {({loading, error, data}) => {
            if (loading)
              return <div>Loading...</div>;
            if (error)
              return <div>Error!</div>;
            return (
              <ul>
                {data.todos.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            );
          }}
        </Query>

        <Mutation
          mutation={ADD_TODO}
          update={(cache, {data: {addTodo}}) => {
            const {todos} = cache.readQuery({query: GET_TODOS});
            cache.writeQuery({
              query: GET_TODOS,
              data: {todos: todos.concat(addTodo)}
            });
          }}
        >
          {addTodo => (
            <form onSubmit={e => this.handleSubmit(e, addTodo)}>
              <div className="input-group">
                <input
                  className="form-control"
                  placeholder="What needs to be done?"
                  onChange={e => this.handleChange(e)}
                  autoFocus={true}
                  value={this.state.text}
                />
                <div className="input-group-append">
                  <button
                    className="btn btn-outline-secondary"
                    type="submit"
                  >
                    Add Todo
                  </button>
                </div>
              </div>
            </form>
          )}
        </Mutation>
      </div>
    );
  }

  handleChange(e) {
    this.setState({text: e.target.value});
  }

  handleSubmit(e, addTodo) {
    e.preventDefault();
    if (!this.state.text.length)
      return;
    addTodo({variables: {text: this.state.text}});
    this.setState({text: ""});
  }
}
