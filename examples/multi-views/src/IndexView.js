import React from "react";

export default class IndexView extends React.Component {
  static getInitialProps() {
    return {IndexView_getInitialProps: true};
  }

  render() {
    return (
      <div>{this.props.greeting}</div>
    );
  }
}
