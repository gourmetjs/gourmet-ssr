import React, {Component} from "react";
import {Link} from "@gourmet/react-i80";
import ItemView from "./ItemView";
import {loginRequired, LogoutView} from "./account";

export default class MainView extends Component {
  static routeHandlers = [loginRequired];

  render() {
    return (
      <>
        <div>
          <Link to={ItemView} params={{itemName: "james"}} search="?logged-in">
            james
          </Link>
        </div>
        <div>
          <Link to={ItemView} params={{itemName: "jane"}} search="?logged-in">
            jane
          </Link>
        </div>
        <div>
          <Link to={LogoutView}>
            Logout
          </Link>
        </div>
      </>
    );
  }
}
