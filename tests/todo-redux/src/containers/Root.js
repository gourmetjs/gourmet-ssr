import React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "./components/App";
import rootReducer from "./reducers";

const Root = ({store}) => {
  return (
    <Provider store={store}>
      <App/>
    </Provider>
  );
};

const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);
