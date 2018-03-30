"use strict";

const React = require("react");
const {Component, Fragment} = React;
const PropTypes = require("prop-types");

class ReactContextProvider extends Component {
  getChildContext() {
    return this.props.gmctx;
  }

  render() {
    return (
      <Fragment>
        {this.props.children}
      </Fragment>
    );
  }
}

ReactContextProvider.childContextTypes = {
  gmctx: PropTypes.object
};

module.exports = ReactContextProvider;
