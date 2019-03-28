---
id: using-apollo-graphql
title: Using Apollo GraphQL
---

## Introduction

Apollo support in Gourmet SSR is provided as a [group](../tutorial-1#preset-vs-group) that you can add to your Gourmet SSR project. We will show you how to use Apollo through an example app in this document.

## Example app

The example project in this document is a simple todo app. You can get and run the example as below.

```text
git clone https://github.com/gourmetjs/gourmet-ssr
cd gourmet-ssr/examples/apollo
npm install
npm run dev
```

Open your browser and go to `http://localhost:3000`.

You will see a screen like this.

![Apollo Todo App](../assets/guide-apollo-todo.png)

There are two todo items pre-populated from the server using the GraphQL query. When you type in the text and click the "Add Todo" button, a new item will be added through a GraphQL mutation.

## Server source code

### lib/server.js

```js
"use strict";

const express = require("express");
const serverArgs = require("@gourmet/server-args");
const gourmet = require("@gourmet/client-lib");
const {ApolloServer} = require("apollo-server-express");
const schema = require("./schema");
const TodoData = require("./TodoData");
const resolvers = require("./resolvers");

const args = serverArgs({workDir: __dirname + "/.."});
const app = express();

const apollo = new ApolloServer({
  typeDefs: schema,
  dataSources() {
    return {todoData: new TodoData()};
  },
  resolvers
});

apollo.applyMiddleware({app});

app.use(gourmet.middleware(args));

app.get("/", (req, res) => {
  res.serve("main");
});

app.use(gourmet.errorMiddleware());

app.listen(args.port, () => {
  console.log(`Server is listening on port ${args.port}...`);
  console.log(`GraphQL path is ${apollo.graphqlPath}`);
});
```

### lib/schema.js

```js
"use strict";

const {gql} = require("apollo-server-express");

module.exports = gql`
type Query {
  todos: [String]!
}

type Mutation {
  addTodo(text: String!): String!
}
`;
```

### lib/resolvers.js

```js
"use strict";

module.exports = {
  Query: {
    todos(_, __, {dataSources}) {
      return dataSources.todoData.getAll();
    }
  },

  Mutation: {
    addTodo(_, {text}, {dataSources}) {
      return dataSources.todoData.addTodo(text);
    }
  }
};
```

### lib/TodoData.js

```js
"use strict";

const {DataSource} = require("apollo-datasource");

const _todos = [
  "Buy a pack of milk",
  "Finish the documentation"
];

module.exports = class TodoData extends DataSource {
  getAll() {
    return _todos.slice();  // make a shallow copy
  }

  addTodo(text) {
    _todos.push(text);
    return text;
  }
};
```

## User interface source code

### src/TodoApp.js

```js
import React, {Component} from "react";
import TodoMain from "./TodoMain";

export default class TodoApp extends Component {
  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoMain/>
      </div>
    );
  }
}
```

### src/TodoMain.js

```js
import React, {Component} from "react";
import {Query, Mutation} from "react-apollo";
import gql from "graphql-tag";

const GET_TODOS = gql`
query GetTodos {
  todos
}
`;

const ADD_TODO = gql`
mutation AddTodo($text: String!) {
  addTodo(text: $text)
}
`;

export default class TodoMain extends Component {
  state = {
    text: ""
  };

  render() {
    return (
      <div className="border p-3">
        <h3>TODO</h3>
        <Query query={GET_TODOS}>
          {({loading, error, data}) => {
            if (loading)
              return <div>Loading...</div>;
            if (error)
              return <div>Error!</div>;
            return (
              <ul id="todos">
                {data.todos.map((text, idx) => (
                  <li key={idx}>{text}</li>
                ))}
              </ul>
            );
          }}
        </Query>

        <Mutation
          mutation={ADD_TODO}
          update={(cache, {data: {addTodo}}) => {
            const {todos} = cache.readQuery({query: GET_TODOS});
            cache.writeQuery({
              query: GET_TODOS,
              data: {todos: todos.concat(addTodo)}
            });
          }}
        >
          {addTodo => (
            <form onSubmit={e => this.handleSubmit(e, addTodo)}>
              <div className="input-group">
                <input
                  id="add_todo"
                  className="form-control"
                  placeholder="What needs to be done?"
                  onChange={e => this.handleChange(e)}
                  autoFocus={true}
                  value={this.state.text}
                />
                <div className="input-group-append">
                  <button
                    id="add_button"
                    className="btn btn-outline-secondary"
                    type="submit"
                  >
                    Add Todo
                  </button>
                </div>
              </div>
            </form>
          )}
        </Mutation>
      </div>
    );
  }

  handleChange(e) {
    this.setState({text: e.target.value});
  }

  handleSubmit(e, addTodo) {
    e.preventDefault();
    if (!this.state.text.length)
      return;
    addTodo({variables: {text: this.state.text}});
    this.setState({text: ""});
  }
}
```

## Configuration source code

### gourmet_config.js

```js
module.exports = {
  pages: {
    main: "./src/TodoApp.js"
  },

  config: {
    html: {
      headTop: [
        '<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">'
      ]
    }
  }
};
```

### package.json

```js
{
  "private": true,
  "scripts": {
    "build": "gourmet build",
    "start": "node lib/server.js",
    "dev": "nodemon --ignore src lib/server.js -- --watch"
  },
  "dependencies": {
    "@gourmet/client-lib": "^1.2.4",
    "@gourmet/server-args": "^1.2.4",
    "express": "^4.16.4",
    "apollo-server-express": "^2.4.8",
    "apollo-datasource": "^0.3.1",
    "graphql": "^14.1.1"
  },
  "devDependencies": {
    "@gourmet/gourmet-cli": "^1.1.4",
    "@gourmet/preset-react": "^1.5.0",
    "@gourmet/group-react-apollo": "^1.1.0",
    "core-js": "^3.0.0",
    "react": "^16.8.5",
    "react-dom": "^16.8.5",
    "nodemon": "^1.18.10"
  }
}
```

## How it works

### Server

We are using the `apollo-server-express` package, instead of the more commonly used `apollo-server` package, because we want to implement an Express server for both the GraphQL serving and SSR rendering. `apollo-server-express` provides the GraphQL server functionality via a Connect/Express compatible middleware.

We are implementing a very simple GraphQL schema that consists of one query and one mutation in `lib/schema.js`. Also, a todo item is defined as a string for simplicity.

`lib/TodoData.js` implements a simple Apollo data source. It uses a global variable `_todo` to save todo items. The data will be reset if the server restarts.

While your server is running, you can open `http://localhost:3000/graphql` in your browser to launch [GraphQL Playground](https://www.apollographql.com/docs/apollo-server/features/graphql-playground.html) and explore your GraphQL schema.

### User interface (SSR)

`TodoApp` is the page component for your app. It doesn't do anything special other than rendering the `TodoMain` component.

`TodoMain` is responsible for everything this app does. It uses `Query` and `Mutation` components from `react-apollo` to run GraphQL operations. In our app, `GetTodos` query is executed on the server side when the initial content is being rendered, and `AddTodo` mutation is executed on the client side when the user clicks `Add Todo` button.

### Packages

For our Express server, we are using the following packages. They are listed in the `dependencies` section of `package.json` because the server needs them at runtime.

- `@gourmet/client-lib`: Gourmet SSR server renderer.
- `@gourmet/server-args`: A common command line options parser for Gourmet SSR projects.
- `express`: Express server framework.
- `apollo-server-express`: Express and Connect integration of GraphQL server.
- `apollo-datasource`: Base class of Apollo DataSource.
- `graphql`: GraphQL core library, should be installed side by side with `apollo-server-express` as a peer dependency.

For SSR code, we are using the following packages. They are listed in the `devDependencies` section of `package.json` because they get built and embedded inside the SSR bundles.

- `@gourmet/preset-react`: A preset of React build tools and runtime helpers.
- `@gourmet/group-react-apollo`: A group of sub-packages that enables Apollo GraphQL support in your project. See below for more information.
- `react`: Standard React library.
- `react-dom`: Standard React library.
- `core-js`: A polyfill library referenced by [Babel output](../tutorial-1#polyfill-and-core-js-as-a-dependency).

The following are dev tools that are needed only at development time.

- `@gourmet/gourmet-cli`
- `nodemon`

###  `@gourmet/group-react-apollo`

Installing this package will automatically enable Apollo support in your project. An instance of `ApolloClient` is created with the sensible defaults and provided to the rest of your React tree, freeing you to use `Query` and `Mutation` components without any additional configuration or bootstrapping as shown in `src/TodoMain.js`.

`react-apollo` and `graphql-tag` packages are included in the group as sub-packages. When you import them into your SSR code, Gourmet Builder will resolve the references to the corresponding sub-packages inside the group, so you don't need to install them individually.

## Advanced topics

### Default options

`@gourmet/group-react-apollo` creates an instance of `ApolloClient` that is similar to the following. (This snippet is for explanation purposes only - note that the real code is not the same.)

```js
const selfUrl = require("@gourmet/self-url");
const {ApolloClient} = require("apollo-client");
const {InMemoryCache} = require("apollo-cache-inmemory");
const {onError} = require("apollo-link-error");
const {ApolloLink} = require("apollo-link");
const {HttpLink} = require("apollo-link-http");

function handleLinkError({graphQLErrors, networkError}) {
  if (graphQLErrors) {
    graphQLErrors.map(({message, locations, path}) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      ),
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
}

function createApolloClient(gmctx) {
  return new ApolloClient({
    ssrMode: gmctx.isServer,
    ssrForceFetchDelay: 100,
    connectToDevTools: false,
    link: ApolloLink.from([
      onError(handleLinkError),
      new HttpLink({
        uri: selfUrl(gmctx, "/graphql")
      })
    ]),
    cache: new InMemoryCache()
  });
}
```

### Specifying Apollo options

You can specify Apollo options through the `apollo` section of `gourmet_config.js` as below.

```js
// gourmet_config.js
module.exports = {
  // ...
  apollo: {
    client: {
      connectToDevTools: true
    },
    linkHttp: {
      uri: "/custom-graphql"
    }
  }
};
```

- **`client`**: Options for [`ApolloClient`](https://www.apollographql.com/docs/react/api/apollo-client.html). Note that `link`, `ssrMode` and `cache` are overridden.
- **`linkHttp`**: Options for [`HttpLink`](https://www.apollographql.com/docs/link/links/http.html#options). Any relative path in `uri` will be converted to an absolute path using [`@gourmet/self-url`](../tutorial-5#converting-a-relative-path-to-an-absolute-path) on the server.
- **`cacheInMemory`**: Options for [`InMemoryCache`](https://github.com/apollographql/apollo-client/tree/master/packages/apollo-cache-inmemory).

Note that you can specify only JSON serializable values through this method.

### Specifying options with non-JSON-serializable values

You can define a static function `createApolloClient()` in your page component to modify Apollo options just before `ApolloClient` is created for the page. You can use this method to specify options with non-JSON-serializable values, or to generate options dynamically based on context at runtime. You can safely modify `options` in-place inside this function.

```js
export default class TodoApp extends Component {
  static createApolloClient(gmctx, options) {
    options.linkHttp.fetch = (url, options) => {
      options.headers["x-my-custom-header"] = "...";
      return fetch(url, options);
    };
  }
  // ...
}
```

### Creating a custom `ApolloClient`

As the function name implies, you can return your own custom instance of `ApolloClient` from the `createApolloClient()` function to override the default behavior completely. Gourmet SSR will use the returned object instead of creating a new one. You can use this method for advanced configuration such as implementing your own `link` chain.

```js
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import {ApolloLink} from "apollo-link";
import {HttpLink} from "apollo-link-http";

export default class TodoApp extends Component {
  static createApolloClient(gmctx, options) {
    return new ApolloClient({
      ...options.client,
      link: ApolloLink.from([
        // ... your ApolloLink middlewares here
        new HttpLink(options.linkHttp)
      ]),
      cache: new InMemoryCache(options.cacheInMemory)
    });
  }
}
```

Don't forget to add the Apollo packages you are using (`apollo-client`, `apollo-cache-inmemory`, ..etc) to your `package.json` if you use this method.

### Disabling Apollo for a specific page

If you return `null` from `createApolloClient()`, the creation of `ApolloClient` is skipped completely and Apollo support will be disabled for the page. This can be useful if you don't want to use the Apollo layer for a specific page in a multi-page project.

### Adding Apollo GraphQL support manually

If you add `@gourmet/group-react-apollo` as a dependency, the Apollo related modules inside the group will be added to your SSR bundles no matter how you implement your `createApolloClient()`. For example, even if you return `null` from `createApolloClient()`, the page bundle will still include those unused modules. Also, if you use different versions of Apollo modules from the ones that come within the group, you will end up having two different versions of Apollo modules in your bundles, resulting in one being unused.

If you want complete control over the dependency of Apollo modules, you can omit `@gourmet/group-react-apollo`, and implement the Apollo GraphQL bootstrapping manually.

```js
// src/TodoApp.js
import React, {Component} from "react";
import selfUrl from "@gourmet/self-url";
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import {HttpLink} from "apollo-link-http";
import {ApolloProvider, getDataFromTree} from "react-apollo";
import TodoMain from "./TodoMain";

let _apollo;

function createApollo(gmctx) {
  const apollo = new ApolloClient({
    ssrMode: gmctx.isServer,
    ssrForceFetchDelay: 100,
    connectToDevTools: false,
    link: new HttpLink({uri: selfUrl(gmctx, "/graphql")}),
    cache: new InMemoryCache()
  });

  if (gmctx.isClient && gmctx.data.apolloState)
    apollo.cache.restore(gmctx.data.apolloState);

  return apollo;
}

function getRenderer(Base) {
  return class ApolloRenderer extends Base {
    prepareToRender(gmctx) {
      return super.prepareToRender(gmctx).then(() => {
        if (gmctx.isServer) {
          gmctx.apolloClient = createApollo(gmctx);
        } else {
          if (!_apollo)
            _apollo = createApollo(gmctx);
          gmctx.apolloClient = _apollo;
        }
      });
    }

    invokeUserRenderer(gmctx) {
      return super.invokeUserRenderer(gmctx).then(element => {
        element = (
          <ApolloProvider client={gmctx.apolloClient}>
            {element}
          </ApolloProvider>
        );
        if (gmctx.isServer) {
          return getDataFromTree(element).then(() => {
            gmctx.data.apolloState = gmctx.apolloClient.cache.extract();
            return element;
          });
        }
        return element;
      });
    }
  };
}

export default class TodoApp extends Component {
  static getServerRenderer = getRenderer;
  static getClientRenderer = getRenderer;

  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoMain/>
      </div>
    );
  }
}
```

```json
// package.json
{
  "private": true,
  "scripts": {
    "build": "gourmet build",
    "start": "node lib/server.js",
    "dev": "nodemon --ignore src lib/server.js -- --watch"
  },
  "dependencies": {
    "@gourmet/client-lib": "^1.2.4",
    "@gourmet/server-args": "^1.2.4",
    "express": "^4.16.4",
    "apollo-server-express": "^2.4.8",
    "apollo-datasource": "^0.3.1",
    "graphql": "^14.1.1"
  },
  "devDependencies": {
    "@gourmet/gourmet-cli": "^1.1.4",
    "@gourmet/preset-react": "^1.5.0",
    "@gourmet/self-url": "^1.1.3",
    "apollo-client": "^2.5.1",
    "apollo-link-http": "^1.5.14",
    "apollo-cache-inmemory": "^1.5.1",
    "core-js": "^3.0.0",
    "react": "^16.8.5",
    "react-dom": "^16.8.5",
    "nodemon": "^1.18.10"
  }
}
```

Note that this is a highly advanced use case. Usually, the customization through `createApolloClient()` would suffice for most use cases. You can access the full source code of this example in the `examples/apollo-manual` folder.
