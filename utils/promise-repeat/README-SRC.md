# @gourmet/promise-repeat

Runs an asynchronous loop in series - the handler will not be called
until the promise returned by the previous call is resolved.

# Basic usage

```js
const promiseRepeat = require("@gourmet/promise-repeat");

const promise = promiseRepeat(() => {
  // ... handler that can return a promise
});
```

This function is much more efficient than simply chaining promises when
the chain becomes very long.

The handler is invoked with no argument and can return one of the following:
  - promise: wait for an async job - a resolved value of `undefined`
    continues the loop and a value other than `undefined` exits the loop.
  - undefined: continue the loop.
  - other: exit the loop.

Returns a promise that is resolved with the handler's return value that
triggered the exit of loop.
