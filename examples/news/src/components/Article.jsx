import React, {PureComponent} from "react";
import {css} from "emotion";
import timeago from "timeago.js";

const cssArticle = css`
  margin: 1.5em 2em;
`;

const cssImage = css`
  max-width: 256px;
  max-height: 256px;
`;

const cssSource = css`
  margin-top: 6px;
  font-size: 85%;
`;

export default class Article extends PureComponent {
  render() {
    const article = this.props.article;
    const ago = timeago();
    return (
      <div className={`${cssArticle} media`}>
        <a href={article.url}>
          <img className={`${cssImage} img-thumbnail mr-3`} src={article.urlToImage}/>
        </a>
        <div className="media-body">
          <h5 className="mt-0">{article.title}</h5>
          {article.description}
          <div className={cssSource}>
            <a href={article.url}>{article.source.name} / {ago.format(article.publishedAt)}</a>
          </div>
        </div>
      </div>
    );
  }
}
