import React, {Component} from "react";
import {Link} from "@gourmet/react-i80";
import {loginRequired} from "./account";

export default class MainView extends Component {
  static routeHandlers = [loginRequired];

  render() {
    const {search} = this.props;
    return (
      <>
        <div>
          <Link id="james" to="item" params={{itemName: "james"}} search={search}>
            james
          </Link>
        </div>
        <div>
          <Link id="jane" to="item" params={{itemName: "jane"}} search={search}>
            jane
          </Link>
        </div>
        <div>
          <Link id="date" to="date" params={{1: 2018, 2: 12, 3: 11}} search={search}>
            Date
          </Link>
        </div>
        <div>
          <Link id="logout" to="account.logout">
            Logout
          </Link>
        </div>
      </>
    );
  }
}
