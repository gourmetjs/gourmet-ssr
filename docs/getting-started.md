---
id: getting-started
title: Getting Started
---

## Creating a simple Express server

First, let's write a simple Express server without Gourmet SSR.

**package.json**
```json
{
  "private": true,
  "scripts": {
    "start": "node lib/server.js"
  }
}
```

**lib/server.js**
```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000...");
});
```

Now install `express` and run the server.

```bash
$ npm install express --save
$ npm start
```

Open your browser at http://localhost:3000 and you will see the "Hello, world!" message.

## Installing Gourmet SSR

Now, we will add the Server-Side Rendering (SSR) feature using Gourmet SSR to our Express server.

Install additional packages we need as below:

```bash
$ npm install @gourmet/gourmet-cli @gourmet/preset-react --save-dev
$ npm install react react-dom --save-dev
```

`@gourmet/gourmet-cli` provides a shell command `gourmet` which is a base command line interface that can be extended by installing additional plugins.

`@gourmet/preset-react` is a preset of sub-packages that contains all the plugins and runtime helpers to implement a Gourmet SSR project using React.

`react` and `react-dom` are standard React libraries. `@gourmet/preset-react` requires React libraries installed side by side as `peerDependencies`.

These packages are needed to build bundles, and once a Gourmet SSR project gets built, runtime helpers are embedded inside the bundles. That's why we can specify them as `devDependencies`. We don't need them ready under `node_modules` when the server is running. A simple rule to remember is:

1. Packages that your server code needs go to `dependencies`.
2. Packages that your SSR code needs go to `devDependencies`.

## Creating a page root component

Create a React component responsible for rendering the user interface.

**src/hello.js**
```jsx
import React from "react";

export default function Hello({greeting}) {
  return <div>{greeting}</div>;
}
```

## Creating a project configuration file

We also need to add a `gourmet_config.js` file which is a build configuration file for a Gourmet SSR project.

**gourmet_config.js**
```js
module.exports = {
  pages: {
    main: "./src/hello.js"
  }
};
```

Here, we specify the above React component as a root component of main page.

> Did you notice that we didn't specify plugins to use in `gourmet_config.js`? Gourmet SSR will automatically scan installed packages and load plugins/presets by default. By installing `@gourmet/preset-react` as a dependency, your Gourmet SSR project is automatically configured to use React.

## Calling SSR renderer from the server

As a last step, modify your server code to use Gourmet SSR to render the user interface.

**lib/server.js**
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

Before to run your server, you have to install a runtime helper that glues your server together with SSR output. This one needs to go inside `dependencies` because your server depends on it.

```bash
$ npm install @gourmet/client-lib --save
```

The middleware created by `gourmet.middleware()` adds `serve()` method to `res` object. `res.serve(pageName, initialProps)` sends a server rendered HTML page content to the client.

`initialProps` will be handed over to the root component and must be a JSON serializable object because it is transferred to the client for rehydration.

## Build and Run

Add the `build` script to `package.json`.

**package.json**
```json
{
  ...
  "scripts": {
    "build": "gourmet build",
    "start": "node lib/server.js"
  }
  ...
}
```
