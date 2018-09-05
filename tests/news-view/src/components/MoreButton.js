import React, {Component} from "react";
import cx from "classnames";
import {css} from "emotion";

const cssButton = css`
  min-width: 15em;
`;

export default class LoadButton extends Component {
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
          "btn btn-sm",
          {"btn-outline-primary": !this.state.lastError},
          {"btn-outline-danger": !!this.state.lastError},
          cssButton,
          this.props.className
        )}
        disabled={this.state.isLoading}
        onClick={() => this._onClick()}
        title={this.state.lastError ? this.state.lastError.message : ""}
      >
        {this.state.lastError ? (
          <span>
            <i className="fas fa-exclamation-triangle"/>
            &nbsp;
          </span>
        ) : null}
        {this.props.label}
        {this.state.isLoading ? (
          <span>
            ...
            &nbsp;
            <i className="fas fa-sync fa-spin"/>
          </span>
        ) : null}
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
