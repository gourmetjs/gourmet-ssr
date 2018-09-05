import React from "react";
import {ActiveRoute} from "@gourmet/react-i80";
import IndexView from "./IndexView";
import DashboardView from "./DashboardView";

export default class MainPage extends React.Component {
  static routes = [
    ["/", IndexView],
    ["/dashboard", DashboardView]
  ];

  render() {
    return (
      <ActiveRoute activeRoute={true}/>
    );
  }
}
