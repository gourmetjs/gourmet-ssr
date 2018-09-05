"use strict";   // eslint-disable-line strict

const loadable = require("@gourmet/react-loadable");
const CustomLoading = require("./CustomLoading").default;

module.exports = loadable({
  loader: () => import(/* webpackChunkName: "profile" */ "./ProfilePanel"),
  loading: CustomLoading
});
