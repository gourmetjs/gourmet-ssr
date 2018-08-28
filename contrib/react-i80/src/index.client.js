"use strict";

const Router = require("./Router");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

// Simple and slow query string parser focusing on small code size
function _qs(search) {
  if (search[0] === "?")
    search = search.substr(1);
  return search.split("&").reduce((query, item) => {
    const [key, value] = item.split("=");
    query[decodeURIComponent(key)] = decodeURIComponent(value || "");
    return query;
  }, {});
}

function _error(mesg) {
  if (typeof mesg === "string")
    console.error("[@gourmet/react-i80]", mesg);
  else
    console.error(mesg);
}

function goToUrl(href, pushState=true) {
  function _load(href) {
    window.location = href; // initiate a new page request
  }

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
  const gmctx = router.gmctx;
  const component = router.component;

  if (gmctx && component) {
    // https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
    const a = document.createElement("a");
    a.href = href;

    const items = _normalize(a);
    const loc = window.location;

    if (items.protocol === loc.protocol && items.host === loc.host) {
      const url = {
        path: items.pathname,
        query: _qs(a.search),
        hash: a.hash
      };
      router.setActiveRoute(gmctx, url).then(route => {
        if (!route.command) {
          if (pushState)
            window.history.pushState({}, "", href);
          component.forceUpdate();
        } else {
          if (route.command === "redirect")
            _load(route.location);
          else
            _load(href);
        }
      }).catch(err => {
        _error(`Error occurred in switching to the URL: ${href}`);
        _error(err);
      });
    } else {
      _load(href);
    }
  } else {
    _error(`Wrapper component is not mounted, loading the URL instead: ${href}`);
    _load(href);
  }
}

// - basePath: Default is `"/"`.
// - captureClick: Default is `true`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {
    getBrowserUrl(/*gmctx*/) {
      const loc = window.location;
      return {
        path: loc.pathname,
        query: _qs(loc.search),
        hash: loc.hash
      };
    },
    clientDidMount(gmctx, component) {
      // We can safely save this information in the singleton on the client
      router.gmctx = gmctx;
      router.component = component;

      window.addEventListener("popstate", () => {
        goToUrl(window.location.href, false);
      });

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
    },
    clientWillUnmount(/*gmctx, component*/) {
      _error("Wrapper component must not be unmounted!");
      router.gmctx = null;
      router.component = null;
    },
    getInitialProps(gmctx, route) {
      if (!router.gmctx) {
        // By design, we do not invoke `getInitialProps()` for the initial
        // rendering on the client side and use serialized data from server instead.
        return Promise.resolve(gmctx.data.routerInitialProps);
      } else {
        return route.getInitialProps(gmctx);
      }
    }
  });
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;
i80.goToUrl = goToUrl;

module.exports = i80;
