import React from "react";
import i80, {ActiveRoute} from "@gourmet/react-i80";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "../components/App";
import Settings from "../components/Settings";
import rootReducer from "../reducers";

i80([
  ["/", App],
  ["/settings", Settings]
]);

const Root = ({store}) => {
  return (
    <Provider store={store}>
      <ActiveRoute/>
    </Provider>
  );
};

let clientReduxStore;

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
    if (!clientReduxStore)
      clientReduxStore = createStore(rootReducer, gmctx.data.reduxState);
    return {
      store: clientReduxStore
    };
  }
};

export default Root;
