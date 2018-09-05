import selfUrl from "@gourmet/self-url";

export default class NewsData {
  constructor(gmctx, pageSize=20) {
    this.gmctx = gmctx;
    this.pageSize = pageSize;
  }

  prepare() {
    return Promise.resolve();
  }

  getCached() {
  }

  getFetchOptions() {
  }

  fetch(page=1) {
    const search = [
      `page=${page}`,
      `pageSize=${this.pageSize}`
    ].join("&");
    return fetch(selfUrl(this.gmctx, `/api/news?${search}`), this.getFetchOptions()).then(res => {
      if (res.status !== 200) {
        const err = new Error("News fetching error: " + res.statusText);
        err.statusCode = res.status;
        throw err;
      }
      return res.json();
    });
  }
}
