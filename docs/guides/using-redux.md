---
id: using-redux
title: Using Redux with Gourmet SSR
---

## Adding Redux packages

To enable Redux support in your existing Gourmet SSR project, you should install `redux` and `react-redux`. You can add them to `devDependencies` because Redux will be used only in your SSR code.

```text
npm install redux react-redux --save-dev
```

## Example app

The example app in this document is based on the original [Redux Todos Example](https://github.com/reduxjs/redux/tree/master/examples/todos). We modified the project slightly to integrate it with Gourmet SSR environment and adjust to our code style.

You can run the example as below:

```text
git clone https://github.com/gourmetjs/gourmet-ssr
cd gourmet-ssr/examples/redux
npm install
npm run dev
```

Open your browser and go to `http://localhost:3000`.

## How it works

All the secret is in `src/containers/Root.js` file. This is the page component of the app.

```js
import React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "../components/App";
import rootReducer from "../reducers";

const fetchInitialState = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        todos: [{
          id: 1,
          text: "Buy a pack of milk",
          completed: true
        }, {
          id: 2,
          text: "Finish the documentation",
          completed: false
        }]
      });
    }, 10);
  });
};

const Root = ({store}) => {
  return (
    <Provider store={store}>
      <App/>
    </Provider>
  );
};

Root.getStockProps = gmctx => {
  if (gmctx.isServer) {
    return fetchInitialState(gmctx).then(state => {
      gmctx.data.reduxState = state;
      return {
        store: createStore(rootReducer, state)
      };
    });
  } else {
    return {
      store: createStore(rootReducer, gmctx.data.reduxState)
    };
  }
};

export default Root;
```

`getStockProps()` is a static function of your page component. Here, it is used to create a Redux store.

Gourmet SSR will call the function to get the stock props before rendering the component. The stock props you return from this function will be provided to the page component, combined with other root-level props, such as the props from `getInitialProps()` and/or `res.serve()`.

`getStockProps()` works very similar to `getInitialProps()`, which we showed you in the [tutorial](https://ssr.gourmetjs.org/docs/tutorial-5#getinitialprops). Compared to `getInitialProps()`, `getStockProps()` is:

- Always invoked before rendering, both on the server and the client.
- Allowed to return any type of props, not limited to JSON serializable objects.

In this example, we use the `fetchInitialState()` function on the server side to get the initial state for Redux store. The data is hard-coded inside the function, simulating an asynchronous fetching operation using a promise. In your real application, this could be an API call or database fetching.

Note that we assign the initial state data to `gmctx.data.reduxState`. Everything you store under `gmctx.data` on the server-side will be serialized as a JSON object and transferred to the client for re-hydration in Gourmet SSR. `reduxState` is just an arbitrary name.

On the client-side, the Redux store is re-hydrated with the state data from `gmctx.data.reduxState`. 

That's it! Enabling Redux in Gourmet SSR is very easy. With this simple snippet in your root components (page or route), Redux will be available to the rest of your React components as usual.

> The state data is not saved in database, so it will be reset whenever the page is refreshed. We wanted to keep this example simple to show you only the important part of Redux integration.

## Advanced topics

### Supplying the initial state

In the example above, we explained the method that your initial state is fetched inside the SSR code via `getStockProps()` static function. This is recommended because the criteria of data to fetch usually depends on the user interface to render.

As an alternative, however, you can supply the initial state from your Node server via `res.serve()` function.

```js
"use strict";

const express = require("express");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");

const args = serverArgs({workDir: __dirname + "/.."});
const app = express();

function fetchInitialState() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        todos: [{
          id: 1,
          text: "Buy a pack of milk",
          completed: true
        }, {
          id: 2,
          text: "Finish the documentation",
          completed: false
        }]
      });
    }, 10);
  });
};

app.use(gourmet.middleware(args));

app.get("/", (req, res, next) => {
  fetchInitialState().then(reduxState => {
    res.serve("main", {reduxState});
  }).catch(next);
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
});
```

With this method, your `Root` component now becomes much simpler as the data fetching is not its responsibility and Gourmet SSR takes care of the dehydration and rehydration automatically.

```js
import React from "react";
import {createStore} from "redux";
import {Provider} from "react-redux";
import App from "../components/App";
import rootReducer from "../reducers";

const Root = ({reduxState}) => {
  return (
    <Provider store={createStore(rootReducer, reduxState)}>
      <App/>
    </Provider>
  );
};

export default Root;
```

You can access the full source code of this example in `examples/redux-init` folder.

### Preserving the state when switching routes

On the server-side, `getStockProps()` is called with a freshly created `gmctx` every time a new HTTP request is served. You will always want this behavior to prevent any possible conflicts between requests.

On the client-side, a page component's `getStockProps()` is called only once when the page is loaded initially. A route component's `getStockProps()` is called initially, and whenever the route changes thereafter. Again, a freshly created `gmctx` is provided to `getStockProps()` in all cases. By contrast, re-rendering of the React tree, triggered by `setState()` happens only on the client-side and doesn't involve with `getStockProps()`


This client-side behavior implies a subtle issue. 

> 
