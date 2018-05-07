import React, {PureComponent} from "react";
import Article from "./Article";

export default class Articles extends PureComponent {
  render() {
    const articles = this.props.articles;
    return (
      <div>
        {articles.map(article => <Article article={article} key={article.url}/>)}
      </div>
    );
  }
}
