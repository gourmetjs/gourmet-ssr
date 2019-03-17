import React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "../components/App";
import rootReducer from "../reducers";

const Root = ({store}) => {
  return (
    <Provider store={store}>
      <App/>
    </Provider>
  );
};

const fetchInitialState = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        todos: [{
          id: 1,
          text: "Buy a pack of milk",
          completed: true
        }, {
          id: 2,
          text: "Finish the documentation",
          completed: false
        }]
      });
    }, 10);
  });
};

Root.getStockProps = gmctx => {
  if (gmctx.isServer) {
    return fetchInitialState(gmctx).then(state => {
      gmctx.data.reduxState = state;
      return {
        store: createStore(rootReducer, state)
      };
    });
  } else {
    return {
      store: createStore(rootReducer, gmctx.data.reduxState)
    };
  }
};

export default Root;
