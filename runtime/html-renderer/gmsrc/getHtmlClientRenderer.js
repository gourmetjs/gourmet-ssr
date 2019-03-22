"use strict";

const promiseProtect = require("@gourmet/promise-protect");
const domready = require("domready");

// We don't need to wait for `DOMContentLoaded` because all `<script>` tags
// are rendered with `defer` attribute which postpones the evaluation of
// the scripts until DOM construction is complete.
// However, we can easily support old browsers that don't support `defer` by
// waiting for `DOMContentLoaded`.
function _domready() {
  return new Promise(resolve => {
    domready(resolve);
  });
}

// options: provided by init function (from `builder.initOptions`)
//  - contentContainerId: string (default: "__gourmet_content__")
//  - dataPropertyName: string (default: "__gourmet_data__")
//  - showErrorInDocument: shows the init error in the document (default: true)
class HtmlClientRenderer {
  constructor(userObject, options) {
    this.userObject = userObject;
    this.options = options || {};
  }

  // The init function doesn't use `context` argument. However, it is used by
  // React I80 to re-render the content when the active route is changed.
  render(context) {
    const gmctx = this.createContext(context);
    return this.prepareToRender(gmctx).then(cont => {
      if (cont !== false)
        return this.invokeUserRenderer(gmctx);
    }).then(content => {
      const elemId = this.options.contentContainerId || "__gourmet_content__";
      return _domready().then(() => {
        return this.renderToDom(gmctx, content, elemId);
      });
    }).catch(err => this.handleError(err));
  }

  createContext(context) {
    const prop = this.options.dataPropertyName || "__gourmet_data__";
    const data = window[prop] || {};
    return Object.assign({
      isServer: false,
      isClient: true,
      renderer: this,
      data
    }, context);
  }

  // Do per-rendering preparation tasks.
  // Must return a promise.
  // If this function returns a promise fulfilled with `false`, `invokeUserRenderer()` is skipped.
  prepareToRender(gmctx) { // eslint-disable-line no-unused-vars
    return Promise.resolve();
  }

  // Do the actual rendering and returns an rendered object.
  // Must return a promise.
  // Default implementation assumes that the `userObject` is a function.
  invokeUserRenderer(gmctx) {
    return promiseProtect(() => {
      return this.userObject(gmctx);
    });
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
      div.innerHTML = `<pre id="render_error" style="${style}">${errmsg}</pre>`;
      document.body.appendChild(div);
    }
  }
}

module.exports = function getHtmlClientRenderer(Base) {
  if (Base)
    throw Error("`@gourmet/html-renderer` must be the first one in the renderer chain. Check your configuration.");
  return HtmlClientRenderer;
};
