---
id: tutorial-2
title: Adding Real UI and Styling
---

## What we will add in this step

Now that we have completed the basic structure of our app, we can add the real user interface of `LoginView` and `SignupView`.

The final result would look like the following.

![Login UI](assets/tutorial-login.png)
![Signup UI](assets/tutorial-signup.png)

You can get the final source files of this step from the GitHub repo as below:

```sh
git clone https://github.com/gourmetjs/news-ssr
cd news-ssr
git checkout step2
```

## Styling using Bootstrap

In this tutorial, we will use Bootstrap for styling our app.
The simplest way to use Bootstrap in Gourmet SSR project is to use the public CDN version of compiled CSS.
Edit the `gourmet_config.js` file as below.

### gourmet_config.js

```js
module.exports = {
  pages: {
    public: "./src/containers/PublicPage",
    main: "./src/containers/MainPage"
  },

  config: {
    html: {
      headTop: [
        '<link href="//stackpath.bootstrapcdn.com/bootstrap/4.1.0/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9gVQ4dYFwwWSjIDZnLEWnxCjeSWFphJiwGPXr1jddIhOegiu1FwO5qRGvFXOdJZ4" crossorigin="anonymous">'
      ]
    }
  }
};
```

Alternatively, you can install the `bootstrap` package and import the compiled CSS file at the pages you want to use as below.

```sh
npm install bootstrap --save-dev
```

```js
// in PublicPage.js & MainPage.js
import "bootstrap/dist/css/bootstrap.min.css";
```

This way, you can eliminate the dependency to the external CDN, and serve Bootstrap from your own server together with other local assets which can be more efficient based on your deployment setup. However, for our tutorial, the public CDN works perfectly well.

## Revised page and views

### src/containers/PublicPage.js

`PublicPage.js` has been edited slightly to apply Bootstrap's CSS class name `container` to the container `div` and to remove the placeholder message.

```js
import React from "react";
import i80, {ActiveRoute} from "@gourmet/react-i80";
import LoginView from "./LoginView";
import SignupView from "./SignupView";

i80([
  ["/login", LoginView],
  ["/signup", SignupView]
]);

export default function PublicPage() {
  return (
    <div className="container">
      <ActiveRoute/>
    </div>
  );
}
```

### src/containers/LoginView.js

`LoginView.js` is converted to a class based component and got a lot more complicated as below.

```js
import React, {Component} from "react";
import i80 from "@gourmet/react-i80";
import CenteredBox from "../components/CenteredBox";
import HorzForm from "../components/HorzForm";
import * as httpApi from "../utils/httpApi";

export default class LoginView extends Component {
  static HEADER = (<h3>Log in to NewsApp</h3>);
  static FOOTER = (<p>New to NewsApp? <a href="/signup">Create an account.</a></p>);

  usernameRef = React.createRef();
  passwordRef = React.createRef();

  render() {
    return (
      <CenteredBox header={LoginView.HEADER} footer={LoginView.FOOTER}>
        <HorzForm onSubmit={() => this.onSubmit()}>
          <div className="form-group row">
            <label htmlFor="username" className="col-sm-3 col-form-label">Username:</label>
            <div className="col-sm-9">
              <input type="text" className="form-control" id="username" name="username"
                placeholder="Username, not email" ref={this.usernameRef} required/>
            </div>
          </div>
          <div className="form-group row">
            <label htmlFor="password" className="col-sm-3 col-form-label">Password:</label>
            <div className="col-sm-9">
              <input type="password" className="form-control" id="password" name="password"
                placeholder="Password" ref={this.passwordRef} required/>
            </div>
          </div>
          <div className="form-group row">
            <div className="offset-sm-3 col-sm-9">
              <button type="submit" className="btn btn-primary">
                Log in
              </button>
            </div>
          </div>
        </HorzForm>
      </CenteredBox>
    );
  }

  onSubmit() {
    const username = this.usernameRef.current.value.toLowerCase().trim();
    const password = this.passwordRef.current.value.trim();

    return httpApi.post("/api/login", {username, password}).then(() => {
      i80.goToUrl("/");
    });
  }
}
```

You may not be familiar with the [class fields](http://2ality.com/2017/07/class-fields.html) syntax of JavaScript such as `static HEADER = ...` and `usernameRef = ...` above. It is not in the final standard yet, but it is currently at stage 3, which is the last stage of the standardization process, so it is pretty safe to use. Gourmet SSR supports the syntax by default.

We use `CenterBox` to render a centered, shadow-boxed content. It also supports a header and a footer. Inside the `CenterBox`, we use `HorzForm` to render a form that supports an API based submit button.

The actual form fields are given as children of `HorzForm`. We use Bootstrap's styling class names to control the layout. See Bootstrap documentation for details.

When user clicks the `Log in` button, `onSubmit()` is executed. `HorzForm` expects the `onSubmit` handler to return a promise. While the promise is pending, `HorzForm` will display a progress bar with all fields disabled. If the promise is successfully resolved with a truthy value, `HorzForm` will re-enable the fields and accept further user interaction. If the promise is rejected with an error, `HorzForm` will display the error message and re-enable the fields to allow the user to retry.

In our example, if POST http request to `/api/login`.

If promise is resolved 
 general components to implement a form based user interface here.

## 
> #### Containers vs components
>


### Data access API

### Adding authentication

### Fetching data

### Using CSS

### Debugging the app

### Deploying the production build on AWS using Elastic Beanstalk

### Polyfill and browser support
