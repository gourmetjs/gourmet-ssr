"use strict";

const React = require("react");
const {Component, Fragment} = React;
const PropTypes = require("prop-types");

class GourmetContextProvider extends Component {
  getChildContext() {
    return {gmctx: this.props.gmctx};
  }

  render() {
    return (
      <Fragment>
        {this.props.children}
      </Fragment>
    );
  }
}

GourmetContextProvider.childContextTypes = {
  gmctx: PropTypes.object
};

module.exports = GourmetContextProvider;
