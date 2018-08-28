import React, {Component} from "react";
import {hot} from "react-hot-loader";
import {ActiveRoute/*, Link*/} from "@gourmet/react-i80";
import PageBase from "../components/PageBase";
//import HomeView from "../components/HomeView";
//import MessagesView from "../components/MessagesView";
//import ProfileView from "../components/ProfileView";

class MainPage extends Component {
  render() {
    return (
      <PageBase>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <a className="nav-link" href="/">Home</a>
                {/*<Link className="nav-link" to={HomeView}/>*/}
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/messages">Messages</a>
                {/*<Link className="nav-link" to={MessagesView}/>*/}
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/profile">Profile</a>
                {/*<Link className="nav-link" to={ProfileView}/>*/}
              </li>
            </ul>
          </div>
          <div className="card-body">
            {<ActiveRoute greeting="hello"/>}
          </div>
        </div>
      </PageBase>
    );
  }
}

export default hot(module)(MainPage);
