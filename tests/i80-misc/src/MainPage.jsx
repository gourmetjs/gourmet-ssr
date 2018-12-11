import React, {Component} from "react";
import i80, {ActiveRoute} from "@gourmet/react-i80";
import MainView from "./MainView";
import ItemView from "./ItemView";
import DateView from "./DateView";
import * as account from "./account";

export default class MainPage extends Component {
  static router = i80([
    ["/", MainView, {name: "main"}],
    ["/item/:itemName", ItemView, {name: "item"}],
    [/^\/(\d{4})\/(\d{2})\/(\d{2})$/, DateView, {
      name: "date",
      reverse(params) {
        return `/${params[1]}/${params[2]}/${params[3]}`;
      }
    }],
    ["/", account.routes]
  ]);

  render() {
    return (
      <ActiveRoute/>
    );
  }
}
