"use strict";

module.exports =
`<!doctype html>
<html lang="en">
  <head>
    <title>Error ({{statusCode}}): {{message}}</title>
    {{head}}
  </head>
  <body>
    <h1>{{message}}</h1>
    <pre>{{detail}}</pre>
  </body>
</html>`;
