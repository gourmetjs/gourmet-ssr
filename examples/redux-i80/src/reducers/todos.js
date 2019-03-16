const getNextId = state => {
  return state.reduce((maxId, todo) => {
    return todo.id > maxId ? todo.id : maxId;
  }, 0) + 1;
};

const todos = (state = [], action) => {
  switch (action.type) {
    case "ADD_TODO":
      return [
        ...state,
        {
          id: getNextId(state),
          text: action.text,
          completed: false
        }
      ];
    case "TOGGLE_TODO":
      return state.map(todo =>
        (todo.id === action.id)
          ? {...todo, completed: !todo.completed}
          : todo
      );
    default:
      return state;
  }
};

export default todos;
