import React from "react";
import {hot} from "react-hot-loader";

class MessageBox extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      message: props.message,
      type: props.type || "primary"
    };
  }

  componentDidMount() {
    this.setState({
      message: "[M] " + this.props.message
    });
  }

  render() {
    const {message, type} = this.state;
    return (
      <div className={`alert alert-${type}`}>
        {message}
        <span className="text-muted font-weight-light">
          &nbsp; -- &apos;[M]&apos; should be added when this component is mounted in DOM
        </span>
      </div>
    );
  }
}

export default hot(module)(MessageBox);
