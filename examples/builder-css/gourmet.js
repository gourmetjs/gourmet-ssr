"use strict";

module.exports = {
  builder: {
    records: "webpack_records/${context:stage}.json"
  },

  entry: {
    main: "./src/index.js"
  }
};
