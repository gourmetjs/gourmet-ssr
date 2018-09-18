import React, {Component} from "react";
import i80, {ActiveRoute, Link} from "@gourmet/react-i80";
import PageBase from "./PageBase";
import HomeView from "./HomeView";
import MessagesView from "./MessagesView";
import ProfileView from "./ProfileView";

export default class MainPage extends Component {
  static router = i80([
    ["/", HomeView],
    ["/messages", MessagesView],
    ["/profile", ProfileView]
  ]);

  render() {
    return (
      <PageBase>
        <div className="card">
          <div className="card-header">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item" onMouseOver={() => HomeView.routeLoadable.preload()}>
                <Link className="nav-link" to={HomeView}/>
              </li>
              <li className="nav-item" onMouseOver={() => MessagesView.routeLoadable.preload()}>
                <Link className="nav-link" to={MessagesView}/>
              </li>
              <li className="nav-item" onMouseOver={() => ProfileView.routeLoadable.preload()}>
                <Link className="nav-link" to={ProfileView}/>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {<ActiveRoute label="View:"/>}
          </div>
        </div>
      </PageBase>
    );
  }
}
