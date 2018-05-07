import React, {Component} from "react";
import cx from "classnames";
import {css} from "emotion";

const cssMoreButton = css`
`;

export default class MoreButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      lastError: null
    };
  }

  render() {
    return (
      <button
        type="button"
        className={cx(
          "btn btn-outline-secondary",
          cssMoreButton,
          this.props.className
        )}
        onClick={() => this._onClick()}
        title={this.state.lastError ? this.state.lastError.message : ""}>
        Load more
        {this.state.isLoading ? <i className="fas fa-sync fa-spin"/> : null}
      </button>
    );
  }

  _onClick() {
    if (!this.state.isLoading) {
      this.setState({isLoading: true, lastError: null});
      this.props.onLoad().then(() => {
        this.setState({isLoading: false, lastError: null});
      }).catch(err => {
        this.setState({isLoading: false, lastError: err});
      });
    }
  }
}
