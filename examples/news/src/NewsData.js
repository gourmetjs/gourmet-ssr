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

  fetch(page=1) {
    const search = [
      `page=${page}`,
      `pageSize=${this.pageSize}`
    ].join("&");
    return fetch(this.gmctx.selfUrl(`/api/news?${search}`)).then(res => {
      if (res.status !== 200) {
        const err = new Error(res.statusText);
        err.statusCode = res.status;
        throw err;
      }
      return res.json();
    });
  }
}
