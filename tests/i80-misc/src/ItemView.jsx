import React, {Component} from "react";
import {Link} from "@gourmet/react-i80";
import {loginRequired, LogoutView} from "./account";

export default class ItemView extends Component {
  static routeHandlers = [loginRequired];

  render() {
    return (
      <>
        <div>
          Item: {this.props.params.itemName}
        </div>
        <Link to={LogoutView}>
          Logout
        </Link>
      </>
    );
  }
}
