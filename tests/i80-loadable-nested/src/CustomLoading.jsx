import React from "react";

export default function CustomLoading(props) {
  if (props.error) {
    return <pre>{props.error.stack}</pre>;
  } else if (props.timedOut) {
    return <div>Timeout error!!!</div>;
  } else if (props.pastDelay) {
    return <div>Be patient, loading...</div>;
  } else {
    return null;
  }
}
