import NewsData from "./NewsData";

const CACHE_EXPIRE = 30 * 1000;

let _cachedData;
let _cachedTime;

export default class NewsDataServer extends NewsData {
  prepare() {
    if (!_cachedData || _cachedTime + CACHE_EXPIRE < Date.now()) {
      return this.fetch().then(data => {
        _cachedData = data;
        _cachedTime = Date.now();
        this.gmctx.data.newsData = _cachedData;
        return data;
      });
    }
    this.gmctx.data.newsData = _cachedData;
    return Promise.resolve();
  }

  getCached() {
    return _cachedData;
  }
}
