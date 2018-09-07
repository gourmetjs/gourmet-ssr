import React, {PureComponent} from "react";

export default class Timer extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      currentTime: "-"
    };
  }

  componentDidMount() {
    const _update = () => {
      const now = new Date();
      const value = now.toDateString() + " " + now.toTimeString();
      this.setState({
        currentTime: value
      });
    };

    this._timerId = setInterval(_update, 1000);

    _update();
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
        <span className="time-value">{this.state.currentTime}</span>
      </pre>
    );
  }
}
