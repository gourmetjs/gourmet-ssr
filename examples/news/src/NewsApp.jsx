import React, {Component} from "react";
import Articles from "./Articles";

export default class NewsApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: props.data.getCached()
    };
  }

  render() {
    return (
      <Articles articles={this.state.articles}/>
    );
  }
}
