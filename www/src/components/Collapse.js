import React, {Component} from "react";
import Transition from "react-transition-group/Transition";
import cx from "classnames";

const CLASS_NAMES = {
  entering: "collapsing",
  entered: "collapse show",
  exiting: "collapsing",
  exited: "collapse"
};

export default class Collapse extends Component {
  state = {
    height: null
  };

  render() {
    const {isOpen=false, duration=350, className, children} = this.props;
    const {height} = this.state;
    return (
      <Transition
        in={isOpen}
        timeout={duration}
        onEntering={this.handleEntering}
        onEntered={this.handleEntered}
        onExit={this.handleExit}
        onExiting={this.handleExiting}
        onExited={this.handleExited}
      >
        {status => (
          <div
            className={cx(className, CLASS_NAMES[status])}
            style={height === null ? null : {height}}
          >
            {children}
          </div>
        )}
      </Transition>
    );
  }

  handleEntering = elem => {
    this.setState({height: elem.scrollHeight});
  };

  handleEntered = () => {
    this.setState({height: null});
  };

  handleExit = elem => {
    this.setState({height: elem.scrollHeight});
  };

  handleExiting = elem => {
    // getting this variable triggers a reflow
    const _unused = elem.offsetHeight; // eslint-disable-line no-unused-vars
    this.setState({height: 0});
  }

  handleExited = () => {
    this.setState({height: null});
  };
}
