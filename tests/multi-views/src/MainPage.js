import React from "react";
import i80, {ActiveRoute} from "@gourmet/react-i80";
import IndexView from "./IndexView";
import DashboardView from "./DashboardView";
import renderProps from "./renderProps";

export default class MainPage extends React.Component {
  static router = i80([
    ["/", IndexView],
    ["/dashboard", DashboardView]
  ]);

  // `renderPage(props)` still gets called for `react-i80` environment too.
  static renderPage(props) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(<MainPage MainPage_renderPage={true} {...props}/>);
      }, 10);
    });
  }

  render() {
    return (
      <div>
        <h1>Page</h1>
        <p>{this.props.greeting}</p>
        <pre>
          {renderProps("Page props", this.props)}
        </pre>
        <ActiveRoute MainPage_activeRoute={true}/>
      </div>
    );
  }
}
