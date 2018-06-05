import React, {Component} from "react";
import {hot} from "react-hot-loader";
import PageBase from "../components/PageBase";
import HomeLoadable from "../components/HomeLoadable";
import MessagesLoadable from "../components/MessagesLoadable";
import ProfileLoadable from "../components/ProfileLoadable";
import {Route, NavLink, Switch} from "react-router-dom";

class MainPage extends Component {
  render() {
    return (
      <PageBase>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item" onMouseOver={() => HomeLoadable.preload()}>
                <NavLink className="nav-link" to="/">Home</NavLink>
              </li>
              <li className="nav-item" onMouseOver={() => MessagesLoadable.preload()}>
                <NavLink className="nav-link" to="/messages">Messages</NavLink>
              </li>
              <li className="nav-item" onMouseOver={() => ProfileLoadable.preload()}>
                <NavLink className="nav-link" to="/profile">Profile</NavLink>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {this._renderPanel()}
          </div>
        </div>
      </PageBase>
    );
  }

  _renderPanel() {
    return (
      <Switch>
        <Route exact path="/" component={HomeLoadable}/>
        <Route exact path="/messages" component={MessagesLoadable}/>
        <Route exact path="/profile" component={ProfileLoadable}/>
      </Switch>
    );
  }
}

export default hot(module)(MainPage);
