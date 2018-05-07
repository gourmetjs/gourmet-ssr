import NewsData from "./NewsData";

export default class NewsDataClient extends NewsData {
  getCached() {
    return this.gmctx.data.newsData;
  }
}
