import React, {Component} from "react";
import cx from "classnames";

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
          this.props.className
        )}
        disabled={this.state.isLoading}
        onClick={() => this._onClick()}
        title={this.state.lastError ? this.state.lastError.message : ""}>
        Load more
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
