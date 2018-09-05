import React, {Component} from "react";
import cx from "classnames";
import {css} from "emotion";

const cssPageBase = css`
  max-width: 60em;
  padding: 2em 0;
`;

export default class PageBase extends Component {
  render() {
    return (
      <div className={cx("container", cssPageBase)}>
        {this.props.children}
      </div>
    );
  }
}
