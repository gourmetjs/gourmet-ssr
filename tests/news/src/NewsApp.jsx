import React, {Component} from "react";
import NewsView from "@gourmet/test-news-view";
import {css} from "emotion";
import "./NewsApp.css";

const cssHeader = css`
  padding: 1em 0;
  text-align: center;
  border-bottom: 1px solid #dee2e6;
`;

const cssFooter = css`
  padding: 1em 0;
  text-align: center;
`;

const cssArticle = css`
  padding: 1.5em 1em;
  border-bottom: 1px solid #dee2e6;
`;

export default class NewsApp extends Component {
  render() {
    return (
      <div className="news-container container">
        <h5>
          Latest US News Headlines
        </h5>
        <NewsView
          cssHeader={cssHeader}
          cssArticle={cssArticle}
          cssFooter={cssFooter}
          newsData={this.props.newsData}
        />
      </div>
    );
  }
}
