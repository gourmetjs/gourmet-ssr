# Gourmet SSR

A Server-Side Rendering Engine for Production

## Introduction

- **Library, not Framework** - Gourmet SSR is designed to be used as a view library in your existing project. We worked very hard to make Gourmet SSR unobtrusive.
- **Production First** - Small footprint at runtime, chunked transfer, long-term caching, HTTP/2 optimized bundling and many more. Production is always the number one priority of Gourmet SSR.
- **Human Friendly** - Developers are humans too. When we added a new feature, the first thing we considered was how to make it easy to understand and use - just like we do for the consumer products.
- **Flexible** - Gourmet SSR can be deployed as an in-process VM sandbox, a separate process, a remote HTTP cluster or an AWS Lambda function. Your server can be Django or Rails. View layer is not limited to React.

## Quick Overview

#### hello.js

```js
import React from "react";

export default function Hello({greeting}) {
  return <div>{greeting}</div>;
}
```

#### gourmet_config.js

```js
module.exports = {
  pages: {
    main: "./hello.js"
  }
};
```

#### server.js

```js
const express = require("express");
const gourmet = require("@gourmet/client-lib");

const app = express();

app.use(gourmet.middleware());

app.get("/", (req, res) => {
  res.serve("main", {greeting: "Hello, world!"});
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
```

#### package.json

```json
{
  "private": true,
  "scripts": {
    "build": "gourmet build",
    "start": "node server.js"
  }
}
```

#### Install

```sh
$ npm install express @gourmet/client-lib --save
$ npm install @gourmet/gourmet-cli @gourmet/preset-react react react-dom --save-dev
```

#### Build and run

```text
$ npm run build
server>
server> >>> Building 'local' stage for 'server' target...
server>
server> Hash: 67lUupnSCkvx5QS2PfiMN5B5M2d
server> Version: webpack 4.28.3
...
client>
client> >>> Building 'local' stage for 'client' target...
client>
client> Hash: 2X8CXpO82qOEnWcj6UiIi6eg5gv
client> Version: webpack 4.28.3
...
$ npm start
Server is listening on port 3000
```

#### Inspect

```html
$ curl http://localhost:3000
<!doctype html>
<html lang="en">
  <head>
    <script defer src="/s/vendors~main.js"></script>
    <script defer src="/s/main.js"></script>
  </head>
  <body>
    <div id="__gourmet_content__"><div id="__gourmet_react__"><div>Hello, world!</div></div></div>
    <script>window.__gourmet_data__={"renderedLoadables":[],"clientProps":{"greeting":"Hello, world!"},"reactClientRender":"hydrate"};</script>
  </body>
</html>
```

## Documentation

Learn more about using [Gourmet SSR on the official website](https://ssr.gourmetjs.org).

- [Getting Started](https://ssr.gourmetjs.org/docs/getting-started)
- [Tutorial](https://ssr.gourmetjs.org/docs/tutorial-1)

## License

Gourmet SSR is open source software [licensed as MIT](https://github.com/gourmetjs/gourmet-ssr/blob/master/LICENSE).
