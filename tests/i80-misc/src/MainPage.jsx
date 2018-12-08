import React, {Component} from "react";
import i80, {ActiveRoute} from "@gourmet/react-i80";
import MainView from "./MainView";
import ItemView from "./ItemView";
import * as account from "./account";

export default class MainPage extends Component {
  static router = i80([
    ["/", MainView],
    ["/item/:itemName", ItemView],
    ["/account", account.routes]
  ]);

  render() {
    return (
      <ActiveRoute/>
    );
  }
}
