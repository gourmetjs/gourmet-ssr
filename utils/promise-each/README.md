# @gourmet/promise-each

Iterates through an array asynchronously in series - the handler will not be called until the promise returned by the previous call is resolved.

# Basic usage

The handler will not be called until the promise returned by the previous call is resolved.

```js
const promiseEach = require("@gourmet/promise-each");

const promise = promiseEach(["a", "b", "c"], (value, index) => {
  console.log(value, index);
  // ... handler that can return a promise
});
```

Console output:

```sh
a 0
b 1
c 2
```

The handler can return one of the following:
  - promise: wait for an async job - a resolved value of `undefined`
    continues the loop and a value other than `undefined` exits the loop.
  - undefined: continue the loop.
  - other: exit the loop.

Returns a promise that is resolved with `undefined` if the loop iterated all
items in the array or handler's return value if it stopped the loop.
