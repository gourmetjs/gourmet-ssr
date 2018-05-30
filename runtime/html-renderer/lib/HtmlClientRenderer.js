"use strict";

const promiseProtect = require("@gourmet/promise-protect");

// Options
//  - contentContainerId: string (default: "__gourmet_content__")
//  - dataPropertyName: string (default: "__gourmet_data__")
//  - showErrorInDocument: shows the init error in the document (default: true)
module.exports = class HtmlClientRenderer {
  constructor(render, options={}) {
    this.options = options;
    this._userRenderer = render;
  }

  invokeUserRenderer(gmctx) {
    return promiseProtect(() => {
      return this._userRenderer(gmctx);
    });
  }

  render() {
    const gmctx = this.createContext();
    this.invokeUserRenderer(gmctx).then(content => {
      const elemId = this.options.contentContainerId || "__gourmet_content__";
      return this.renderToDom(gmctx, content, elemId);
    }).catch(err => this.handleError(err));
  }

  createContext() {
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = window[prop] || {};
    return {
      isServer: false,
      isClient: true,
      data
    };
  }

  renderToDom(gmctx, content, elemId) { // eslint-disable-line no-unused-vars
    // Base class does nothing because `content` is an opaque object that only
    // the derived class knows how to render. It should be rendered as children
    // of `#${elemId}` DOM element.
  }

  handleError(err) {
    const indoc = this.options.showErrorInDocument;
    const errmsg = err.toString();

    console.error(err);

    if (indoc === undefined || indoc) {
      const style = [
        "position:fixed",
        "top:0",
        "left:0",
        "width:400px",
        "border:2px solid #f5c6cb",
        "color:#721c24",
        "background-color:#f8d7da",
        "text-align:left",
        "white-space:pre-wrap",
        "padding:14px 20px",
        "margin:20px",
        "font-size:14px"
      ].join(";");
      const div = document.createElement("div");
      div.innerHTML = `<pre style="${style}">${errmsg}</pre>`;
      document.body.appendChild(div);
    }
  }
};
