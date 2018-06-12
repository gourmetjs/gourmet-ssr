import React from "react";
import {hot} from "react-hot-loader";

function MessageBox({message, type="primary"}) {
  return <div className={`alert alert-${type}`}>{message}</div>;
}

export default hot(module)(MessageBox);
