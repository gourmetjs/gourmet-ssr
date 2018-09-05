import React, {Component} from "react";
import NewsView from "@gourmet/test-news-view";
import cx from "classnames";
import {css} from "emotion";
import {hot} from "react-hot-loader";

const cssContainer = css`
  max-width: 50em;
  padding: 2em 0;
`;

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

class NewsApp extends Component {
  render() {
    return (
      <div className={cx(cssContainer, "container")}>
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

export default hot(module)(NewsApp);
