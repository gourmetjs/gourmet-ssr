import React, {Component} from "react";
import Article from "./Article";

export default class Articles extends Component {
  render() {
    const articles = this.props.articles;
    return (
      <div className={this.props.className}>
        {articles.map(article => <Article className={this.props.cssArticle} article={article} key={article.url}/>)}
      </div>
    );
  }
}
