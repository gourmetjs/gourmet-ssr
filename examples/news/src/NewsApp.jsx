import React, {Component} from "react";
import {hot} from "react-hot-loader";
import {css} from "emotion";
import RefreshButton from "./components/RefreshButton";
import Articles from "./components/Articles";
import MoreButton from "./components/MoreButton";

const cssCard = css`
  margin: 2em 0;
`;

const cssRefreshButton = css`
  margin-top: 6px;
`;

const cssMoreButton = css`
  margin: 0 1em 1em 1em;
`;

class NewsApp extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.newsData.getCached()
    };
  }

  render() {
    return (
      <div className="container">
        <div className={`${cssCard} card`}>
          <div className="card-header text-white bg-primary">
            <h5>
              Latest US News Headlines
              <RefreshButton
                classNames={`${cssRefreshButton} float-right`}
                onRefresh={() => this._onRefresh()}/>
            </h5>
          </div>
          <div className="card-body">
            <Articles articles={(this.state.data && this.state.data.articles) || []}/>
          </div>
          <MoreButton
            className={cssMoreButton}
            onLoad={() => this._onLoad()}/>
        </div>
      </div>
    );
  }

  _onRefresh() {
    const newsData = this.props.newsData;
    return newsData.fetch().then(data => {
      const first = this.state.data.articles[0];
      const idx = data.articles.findIndex(article => {
        return article.url === first.url;
      });
      if (idx === 0) {
        console.log("No change");
        this.setState({data: Object.assign({}, this.state.data)});  // to update xxx ago labels
        return;
      }
      if (idx !== -1) {
        data.articles = data.articles.slice(0, idx).concat(this.state.data.articles);
        const oldLen = data.articles.length;
        data.articles.length = Math.floor(data.articles.length / newsData.pageSize) * newsData.pageSize;
        console.log("Updating: %d in, %d out", idx, oldLen - data.articles.length);
      } else {
        console.log("Replacing the whole articles");
      }
      this.setState({data});
    });
  }

  _onLoad() {
    const newsData = this.props.newsData;
    const page = Math.floor(this.state.data.articles.length / newsData.pageSize) + 1;
    console.log("Loading page %d", page);
    return newsData.fetch(page).then(data => {
      data.articles = this.state.data.articles.concat(data.articles);
      this.setState({data});
    });
  }
}

export default hot(module)(NewsApp);
