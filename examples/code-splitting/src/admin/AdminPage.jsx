import React, {Component} from "react";
import {hot} from "react-hot-loader";
import PageBase from "../components/PageBase";

class AdminPage extends Component {
  render() {
    return (
      <PageBase>
        <div className="alert alert-info">
          <h1>Admin page</h1>
        </div>
      </PageBase>
    );
  }
}

export default hot(module)(AdminPage);
