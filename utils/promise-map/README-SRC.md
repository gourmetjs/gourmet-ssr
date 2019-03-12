# {{pkg.name}}

{{desc}}

# Basic usage

```js
const map = require("@gourmet/promise-map");

function checkUrl(url) {
  return someHowGetTheHttpStatusCodeFromTheUrl(url).then(status => {
    return status === 200 ? "OK" : "Down";
  });
}

map(["https://www.google.com", "https://github.com"], url => {
  return checkUrl(url);
}).then(results => {
  console.log(results);   // ["OK", "OK"]
});
```
