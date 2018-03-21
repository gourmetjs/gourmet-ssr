# @gourmet/promise-main

Handles the top main promise of a console app.

# Why?

Because all errors should be propagated properly to the top main promise and
there must be only one error handler in a console app.

# Basic usage

```js
const promiseMain = require("@gourmet/promise-main");

function main() {
  // ... main function of a console app that returns a promise ...
}

// Instead of this
/*
main().catch(err => {
  console.error(err);
  process.exit(1);
});
*/

// Do this
promiseMain(main());
```
