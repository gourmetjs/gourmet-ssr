---
id: tutorial-5
title: Finalizing the User Interface
---

## What we will add in this step

We will add the user interface for browsing news articles, backed by server APIs we added in the previous step. This will finalize the app for our tutorial, because the next step will be all about deploying the final app in the production environment.

## Fetching data for SSR

### Best practice

Because your SSR code for rendering the user interface can run on both sides of target environment - server and browser, there are two cases in the data fetching.

1. When you render the initial content on the server-side, initiated by `res.serve()`.
2. When you update the DOM on the client side, usually initiated by the user's action such as clicking a button.

To make your life easier, it is best to make your data fetching code "isomorphic" as well. To support this, we encourage the following architecture as best practice.

- Implement all your data access as public APIs, and make them accessible equally from server and client.
- Inside your SSR code, fetch data by invoking the APIs.

Because your API's signatures are the same regardless of where your code is running, your data fetching code becomes isomorphic. Now only issue that we need to care about is the transport layer. Gourmet SSR provides the following two browser compatible methods inside the server-side VM sandbox.

- [`fetch`](https://fetch.spec.whatwg.org/) - You can use `fetch` as a global function just like you do in the modern browser. Under the hood, Gourmet SSR uses [`node-fetch`](https://github.com/bitinn/node-fetch) to simulate the browser API.
- [`XMLHttpRequest`](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) - You can use `XMLHttpRequest` as a global object. We recommend `fetch`, but `XMLHttpRequest` is also provided for the case that you might need to use the legacy codebase. `XMLHttpRequest` in Gourmet SSR is based on [`node-XMLHttpRequest`](https://github.com/driverdan/node-XMLHttpRequest) with the local file access and the synchronous operation removed.

### `static getInitialProps()`

In addition to the basic transport layer, Gourmet SSR also provides a higher level assistance for the isomorphic data fetching.
When the rendering happens on the server-side, Gourmet SSR looks for a static function `getInitialProps()` in your page component. If it is defined, the static function gets called before the rendering begins. If it returns a promise, Gourmet SSR will wait for the promise to be resolved.

`getInitialProps()` is supposed to return an object, or a promise to be resolved with an object. The properties of the object will be handed over to the the page component as React props.

The initial properties returned by the page component's `getInitialProps()` will be serialized as a JSON object and transferred to the client. That is, the page component's `getInitialProps()` will be executed on the server-side only.

The view component (React I80's matching route component) also supports `getInitialProps()`. If defined, the result object is handed over to the view component as properties, in addition to the page component's result of `getInitialProps()`, in case it is defined as well.

One subtlety of view component's `getInitialProps()` is that, because views can be switched on the client side, it can be executed on the client as well. The initial content rendered on the server will contain a serialized result of the view component's `getInitialProps()`, so it will not be executed on the client side as in the page component. However, if a view switch occurs on the client, the newly active view's `getInitialProps()` will be executed on the browser.

> The idea of the asynchronous data fetching via a static function of a component, named `getInitialProps()`, got popular by [Next.js](https://nextjs.org/learn/basics/fetching-data-for-pages). We appreciate their work for the inspiration.

### Authentication

One last important issue regarding the isomorphic data fetching is the authentication. Let's take a look at the flow of interaction between client and server in our app.

1. A user logs in to our news app. Now, a session cookie is saved in the user's browser.
2. The user visits `/` to get the HTML page containing the latest news articles.
3. The server receives the request and verifies the session cookie.
4. The server calls `res.serve("main")` to render the page.
5. Gourmet SSR calls the static `getInitialProps()` function of the page/view component.
6. The `getInitialProps()` function sends a HTTP GET request to the server API `/api/news` to fetch the latest news articles.
7. The server API `/api/news` verifies the session cookie, and sends back the news articles.
8. Gourmet SSR continues to render the initial content with the result of `getInitialProps()`.
9. The server-rendered HTML page is sent back to the browser.
10. The user clicks `Load more` button to fetch more articles.
11. The browser sends a HTTP GET request to the server API `/api/news` to fetch more articles.
12. The server API `/api/news` verifies the session cookie, and sends back the news articles.
13. The browser appends new articles to the DOM.

Without a special care, the request will fail at #7, because the request is generated on the server-side, via the isomorphic `fetch` method provided by Gourmet SSR. Unlike the browser, the server-side `fetch` can't attach the session cookie to the request automatically. It always generates clean, cookie-less requests by default. There are possibly many solutions to this problem. A few examples are:

- Extract the session cookie from the original request at #3 and attach it to the API request at #6.
- Implement a token-based authentication method for APIs, and use tokens for server-side requests at #6. The server-side request tokens can be short-lived ones derived from the session data at #3, or from the client token if the client session is also using a token-based authentication method such as OAuth.
- Allow server-side API requests only from legitimate IP addresses.
- Use a global-super-power token for server-side API requests. You must keep this token secret.

We use method #1 for this tutorial. It is simple, and at least, as secure as the cookie based authentication itself which is widely used for many decades.

## Changes for containers

### src/containers/NewsView.js

`NewsView` now becomes a class-based component to define `getInitialProps()` as a static function. `getInitialProps()` receives an argument `gmctx`, which is an object that contains the context information about the current rendering request of Gourmet SSR. We need it to extract the session cookie from the original client request (#3 in the flow). We will explain more on `gmctx` later.

Because `NewsView` and `SavedView` are almost the same, we factored the actual implementation out to `ArticlesPane` to share.

```js
import React, {Component} from "react";
import ArticlesPane from "./ArticlesPane";

export default class NewsView extends Component {
  static getInitialProps(gmctx) {
    return ArticlesPane.fetchInitialArticles("news", gmctx);
  }

  render() {
    return (
      <ArticlesPane source="news" {...this.props}/>
    );
  }
}
```

### src/containers/SavedView.js

```js
import React, {Component} from "react";
import ArticlesPane from "./ArticlesPane";

export default class SavedView extends Component {
  static getInitialProps(gmctx) {
    return ArticlesPane.fetchInitialArticles("saved", gmctx);
  }

  render() {
    return (
      <ArticlesPane source="saved" {...this.props}/>
    );
  }
}
```

### src/containers/ArticlesPane.js

?? Emotion as a separate section? ??

Here, we use [`Emotion`](https://5bb1495273f2cf57a2cf39cc--emotion.netlify.com/) for styling. Gourmet SSR provides a seamless integration with Emotion, including the auto-enabling of `babel-plugin-emotion`, and the stream-based server rendering via `renderStylesToNodeStream()`.

> Currently, Gourmet SSR supports Emotion v9. We are aware of the release of v10.
> It appears that v10 is a drastic departure from the previous version with many breaking changes in the user-facing API.
> We didn't spend enough time to evaluate the benefit of changes yet.
> Stay tuned!

```js
import React, {Component} from "react";
import {css} from "emotion";
import httpApi from "../utils/httpApi";
import Articles from "../components/Articles";
import LoadButton from "../components/LoadButton";
import ErrorBanner from "../components/ErrorBanner";

const cssFooter = css`
  padding: 1em 0;
  text-align: center;
`;

const cssEmpty = css`
  color: #ccc;
  font-size: 300%;
  padding: 4em 1em;
`;

const cssError = css`
  position: fixed;
  width: 25em;
  left: 2em;
  top: 1em;
  z-index: 100;
`;

function Empty() {
  return (
    <div className={cssEmpty}>
      <i className="fas fa-exclamation-circle"/>
      &nbsp;
      This list is empty
    </div>
  );
}

export default class ArticlesPane extends Component {
  constructor(props) {
    super(props);
    this.state = {
      articles: props.articles,
      hasMore: props.hasMore,
      page: 1,
      lastError: null
    };
  }

  // source = "news" or "saved"
  static fetchInitialArticles(source, gmctx) {
    return httpApi(`/api/${source}`, {method: "GET"}, gmctx);
  }

  render() {
    const {articles, hasMore, lastError} = this.state;
    return (
      <>
        {lastError && (
          <ErrorBanner
            className={cssError}
            error={lastError}
            onClose={() => this.clearError()}
          />
        )}
        {articles && articles.length ? (
          <Articles
            articles={articles}
            saveArticle={article => this.saveArticle(article)}
            unsaveArticle={id => this.unsaveArticle(id)}
          />
        ) : (
          <Empty/>
        )}
        {hasMore ? (
          <div className={cssFooter}>
            <LoadButton label="Load more" onLoad={() => this.loadMore()}/>
          </div>
        ) : null}
      </>
    );
  }

  loadMore() {
    const {source} = this.props;
    const {page, articles} = this.state;

    return httpApi(`/api/${source}?page=${page + 1}`).then(data => {
      this.setState({
        articles: articles.concat(data.articles),
        hasMore: data.hasMore,
        page: page + 1
      });
    }).catch(err => {
      this.setState({lastError: err});
      throw err;
    });
  }

  saveArticle(article) {
    return httpApi("/api/saved", {
      method: "POST",
      body: {article}
    }).then(() => {
      const articles = this.state.articles.map(a => {
        if (a.id === article.id)
          return {...a, saved: true};
        else
          return a;
      });
      this.setState({articles});
    }).catch(err => {
      this.setState({lastError: err});
    });
  }
  
  unsaveArticle(articleId) {
    return httpApi(`/api/saved/${articleId}`, {method: "DELETE"}).then(() => {
      const {source} = this.props;
      let articles;
      if (source === "news") {
        articles = this.state.articles.map(a => {
          if (a.id === articleId)
            return {...a, saved: false};
          else
            return a;
        });
      } else {
        articles = this.state.articles.filter(a => {
          return a.id !== articleId;
        });
      }
      this.setState({articles});
    }).catch(err => {
      this.setState({lastError: err});
    });
  }

  clearError() {
    this.setState({lastError: null});
  }
}
```

## Gourmet Context: `gmctx`
