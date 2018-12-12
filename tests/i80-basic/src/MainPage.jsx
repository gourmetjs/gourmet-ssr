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
              <li className="nav-item">
                <Link className="nav-link" to={HomeView} replace>
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={MessagesView} onClick={e => this.handleClick(e)}>
                  Messages
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to={ProfileView} replace>
                  Profile
                </Link>
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

  // To see if `onClick` of a component works as expected with `react-i80`
  handleClick(e) {
    e.preventDefault();
    i80.goToUrl(i80.getUrl(MessagesView), "replace");
  }
}
