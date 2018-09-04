import React from "react";

export default class MainPage extends React.Component {
  static getInitialProps() {
    return {MainPage_getInitialProps: true};
  }

  render() {
    return (
      <div>{this.props.greeting}</div>
    );
  }
}
