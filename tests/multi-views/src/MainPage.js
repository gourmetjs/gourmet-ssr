import React from "react";
import i80, {ActiveRoute, Link} from "@gourmet/react-i80";
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
        <pre id="page_props">
          {renderProps("Page props", this.props)}
        </pre>
        <ActiveRoute MainPage_activeRoute={true}/>
        <p>
          <Link to={IndexView}>
            {(props, route, isActive) => {
              if (isActive)
                return "Go to index view";
              else
                return <a {...props}>Go to index view</a>;
            }}
          </Link>
        </p>
        <p>
          <Link to={DashboardView}>
            {(props, route, isActive) => {
              if (isActive)
                return "Go to dashboard view";
              else
                return <a {...props}>Go to dashboard view</a>;
            }}
          </Link>
        </p>
      </div>
    );
  }
}
