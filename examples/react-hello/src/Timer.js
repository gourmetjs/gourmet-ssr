import React, {Component} from "react";

export default class Timer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentTime: "-"
    };
  }

  componentDidMount() {
    function _get() {
      const now = new Date();
      return now.toDateString() + " " + now.toTimeString();
    }

    this._timerId = setInterval(() => {
      this.setState({
        currentTime: _get()
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this._timerId) {
      clearInterval(this._timerId);
      this._timerId = null;
    }
  }

  render() {
    return (
      <pre>
        <span>Current time:</span>
        &nbsp;
        <span>{this.state.currentTime}</span>
      </pre>
    );
  }
}
