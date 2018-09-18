import React, {Component} from "react";
import PageBase from "./PageBase";

export default class AdminPage extends Component {
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
