import React, {Component} from "react";
import {hot} from "react-hot-loader";
import PageBase from "../components/PageBase";

import(/* webpackChunkName: "home" */ "../components/HomePanel").then(() => {
  console.log("LOADED!!");
});

class MainPage extends Component {
  render() {
    return (
      <PageBase>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-ta bs card-header-tabs">
              <li className="nav-item">
                <a className="nav-link active" href="#">Active</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#">Link</a>
              </li>
              <li className="nav-item">
                <a className="nav-link disabled" href="#">Disabled</a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            Main page
          </div>
        </div>
      </PageBase>
    );
  }
}

export default hot(module)(MainPage);
