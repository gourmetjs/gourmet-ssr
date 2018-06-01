"use strict";

const loadable = require("@gourmet/react-loadable");
const Loading = require("./Loading");

module.exports = loadable({
  loader: () => import(/* webpackChunkName: "profile" */ "./ProfilePanel"),
  loading: Loading
});
