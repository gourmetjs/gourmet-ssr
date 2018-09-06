"use strict";

const Router = require("./Router");
const {parseHref} = require("./utils");
const ActiveRoute = require("./ActiveRoute");
const Link = require("./Link");

function _error(mesg) {
  if (typeof mesg === "string")
    console.error("[@gourmet/react-i80]", mesg);
  else
    console.error(mesg);
}

// Relative path is not supported
function goToUrl(href, pushState=true) {
  function _load(href) {
    window.location = href; // initiate a new page request
  }

  const router = Router.get();
  const renderer = router.renderer;

  if (renderer) {
    const loc = window.location;
    const url = parseHref(href);
    let origin = url.origin;

    if (origin && origin.startsWith("//"))
      origin = loc.protocol + origin;

    if (!origin || origin === loc.origin) {
      renderer.render({
        i80: {
          switchToHref: href,
          didSwitchToHref() {
            if (pushState)
              window.history.pushState({}, "", href);
          },
          routeNotFound() {
            _load(href);
          }
        }
      });
    } else {
      _load(href);
    }
  } else {
    _error(`Renderer is not initialized, loading the URL instead: ${href}`);
    _load(href);
  }
}

// - basePath: Default is `"/"`.
// - caseSensitive: Default is `true`.
// - strictSlash: Default is `false`.
// - captureClick: Default is `true`.
function i80(routes, options={}) {
  const router = Router.create(routes, options, {
    setRenderer(renderer) {
      router.renderer = renderer;

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

    getTargetHref(gmctx) {
      if (gmctx.i80.switchToHref)
        return gmctx.i80.switchToHref;
      return window.location.href;
    },

    getInitialProps(route) {
      if (!router.gmctx) {
        // By design, we do not invoke `getInitialProps()` for the initial
        // rendering on the client side and use serialized data from server instead.
        return Promise.resolve(route.gmctx.data.routerInitialProps);
      } else {
        return route.getInitialProps();
      }
    },

    goToUrl
  });
}

i80.ActiveRoute = ActiveRoute;
i80.Link = Link;
i80.goToUrl = goToUrl;

module.exports = i80;
