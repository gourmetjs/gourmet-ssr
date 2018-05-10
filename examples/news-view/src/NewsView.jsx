import React, {Component} from "react";
import promiseRepeat from "@gourmet/promise-repeat";
import Articles from "./components/Articles";
import MoreButton from "./components/MoreButton";

export default class NewsView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: props.newsData.getCached()
    };
  }

  render() {
    return (
      <div className={this.props.className}>
        <div className={this.props.cssHeader}>
          <MoreButton label="Refresh" onLoad={() => this._onRefresh()}/>
        </div>
        <Articles
          className={this.props.cssBody}
          cssArticle={this.props.cssArticle}
          articles={(this.state.data && this.state.data.articles) || []}
        />
        <div className={this.props.cssFooter}>
          <MoreButton label="Load more" onLoad={() => this._onLoadMore()}/>
        </div>
      </div>
    );
  }

  _itemExists(items, find) {
    return items.find(item => item.url === find.url);
  }

  _updateArticles(data, handler) {
    const des = [].concat(this.state.data.articles);
    const src = data.articles;
    const count = handler(des, src);
    this.setState({data: Object.assign({}, data, {articles: des})});
    console.log(`Updated: ${count} new, ${des.length} total`);
  }

  _onRefresh() {
    return this.props.newsData.fetch().then(data => {
      this._updateArticles(data, (des, src) => {
        let added = 0, item;
        while ((item = src.pop())) {
          if (!des.find(d => d.url === item.url)) {
            des.unshift(item);
            added++;
          }
        }
        return added;
      });
    });
  }

  _onLoadMore() {
    const newsData = this.props.newsData;
    const len = this.state.data.articles.length;
    const size = newsData.pageSize;
    let page = Math.floor(len / size) + 1;
    const endPage = page + (len % size ? 2 : 1);

    return promiseRepeat(() => {
      if (page >= endPage)
        return true;
      return newsData.fetch(page++).then(data => {
        this._updateArticles(data, (des, src) => {
          let added = 0, item;
          while ((item = src.shift())) {
            if (!des.find(d => d.url === item.url)) {
              des.push(item);
              added++;
            }
          }
          return added;
        });
      });
    });
  }
}
