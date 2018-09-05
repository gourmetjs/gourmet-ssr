import React, {Component} from "react";
import {css} from "emotion";

const panelStyle = css`
  margin: 1em;
  padding: 1em;
  border: 1px solid #ddd;
`;

class PanelB extends Component {
  render() {
    return (
      <div className={panelStyle}>
        This is the content of Panel B
      </div>
    );
  }
}

export default PanelB;
