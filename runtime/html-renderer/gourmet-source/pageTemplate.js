"use strict";

module.exports =
`<!doctype html>
<html lang="{{lang}}">
  <head>
    {{headTop}}
    {{headMain}}
    {{headBottom}}
  </head>
  <body>
    {{bodyTop}}
    <div id="__gourmet_content__">{{[__bodyMain__]}}</div>
    {{[__bodyTail__]}}
    {{bodyBottom}}
  </body>
</html>`;
