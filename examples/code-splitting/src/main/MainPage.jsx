import React, {Component} from "react";
import cx from "classnames";
import {hot} from "react-hot-loader";
import PageBase from "../components/PageBase";
import HomeLoadable from "../components/HomeLoadable";
import MessagesLoadable from "../components/MessagesLoadable";
import ProfileLoadable from "../components/ProfileLoadable";

class MainPage extends Component {
  render() {
    const gmctx = this.props.gmctx;
    const path = gmctx.isServer ? gmctx.path : window.location.pathname;

    return (
      <PageBase>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a className={cx("nav-link", {active: path === "/"})} href="/">Home</a>
              </li>
              <li className="nav-item">
                <a className={cx("nav-link", {active: path === "/messages"})} href="/messages">Messages</a>
              </li>
              <li className="nav-item">
                <a className={cx("nav-link", {active: path === "/profile"})} href="/profile">Profile</a>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {this._renderPanel(path)}
          </div>
        </div>
      </PageBase>
    );
  }

  _renderPanel(path) {
    if (path === "/")
      return <HomeLoadable/>;
    else if (path === "/messages")
      return <MessagesLoadable/>;
    else if (path === "/profile")
      return <ProfileLoadable/>;
  }
}

export default hot(module)(MainPage);
