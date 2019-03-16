import React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "../components/App";
import rootReducer from "../reducers";

const Root = ({reduxState}) => {
  return (
    <Provider store={createStore(rootReducer, reduxState)}>
      <App/>
    </Provider>
  );
};

export default Root;
