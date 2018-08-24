"use strict";

const Router = require("./Router");
const CurrentRoute = require("./CurrentRoute");
const Link = require("./Link");

function goToUrl(href) {
  function _normalize(items) {
    const protocol = items.protocol || window.location.protocol;
    const hostname = items.hostname || window.location.hostname;
    let port = items.port;
    const pathname = items.pathname;

    if (protocol === "http:" && port === "80")
      port = "";
    else if (protocol === "https:" && port === "443")
      port = "";

    return {
      protocol: protocol,
      host: hostname + (port ? ":" + port : ""),
      pathname: pathname[0] === "/" ? pathname : "/" + pathname
    };
  }

  const router = Router.get();

  // https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  const a = document.createElement("a");
  a.href = href;

  const items = _normalize(a);
  const loc = _normalize(window.location);

  if (items.protocol === loc.protocol && items.host === loc.host) {
    if (router.hasRoute(items.pathname)) {
      window.history.pushState({}, "", href);
      router.forceUpdate();
      return;
    }
  }

  window.location = href; // initiate a new page request
}

// - basePath: Default is `"/"`.
// - captureClick: Default is `true`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {
    redirect(gmctx, href) {
      goToUrl(href);
    },
    getCurrentUrl(/*gmctx*/) {
      const loc = window.location;
      return {
        path: loc.pathname,
        query: loc.search,
        hash: loc.hash
      };
    }
  });

  window.addEventListener("popstate", () => router.forceUpdate());

  if (options.captureClick === undefined || options.captureClick) {
    document.addEventListener("click", function(evt) {
      if (evt.defaultPrevented ||
          evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey ||
          evt.button !== 0)
        return;

      let elem = evt.target;

      // Since a click could originate from a descendant of the `<a>` tag,
      // search through the tree upward to find the closest `<a>` tag.
      while (elem && elem.nodeName !== "A") {
        elem = elem.parentNode;
      }

      if (!elem ||
          (elem.target && elem.target !== "_self") ||
          elem.download)
        return;

      const href = elem.getAttribute("href");

      if (href)
        goToUrl(href);

      evt.preventDefault();
    });
  }
}

i80.CurrentRoute = CurrentRoute;
i80.Link = Link;
i80.goToUrl = goToUrl;

module.exports = i80;
