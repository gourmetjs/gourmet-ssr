import React, {Component} from "react";
import {Link} from "@gourmet/react-i80";
import {loginRequired} from "./account";

export default class ItemView extends Component {
  static routeHandlers = [loginRequired];

  render() {
    const {search} = this.props;
    return (
      <>
        <div id="item">
          Item: {this.props.params.itemName}
        </div>
        <div>
          <Link id="main" to="main" search={search}>
            Back to main
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
