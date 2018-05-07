import React, {Component} from "react";
import cx from "classnames";
import {css} from "emotion";

const cssRefreshButton = css`
  &:hover {
    color: black;
  }
  &:active {
    color: grey;
  }
`;

export default class RefreshButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isRefreshing: false,
      lastError: null
    };
  }

  render() {
    return (
      <i
        className={cx(
          "fas fa-sync",
          {"text-danger": !!this.state.lastError},
          this.state.isRefreshing ? "fa-spin" : cssRefreshButton,
          this.props.classNames
        )}
        onClick={() => this._onClick()}
        title={this.state.lastError ? this.state.lastError.message : ""}/>
    );
  }

  _onClick() {
    if (!this.state.isRefreshing) {
      this.setState({isRefreshing: true, lastError: null});
      this.props.onRefresh().then(() => {
        this.setState({isRefreshing: false, lastError: null});
      }).catch(err => {
        this.setState({isRefreshing: false, lastError: err});
      });
    }
  }
}
