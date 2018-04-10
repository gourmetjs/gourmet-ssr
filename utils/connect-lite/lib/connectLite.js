"use strict";

module.exports = function connectLite() {
  function app(req, res, done) {
    function _next(err) {
      const handler = stack[index++];

      if (!handler) {
        if (done)
          done(err);
        return;
      }

      _call(handler, err, req, res, _next);
    }

    function _call(handler, err, req, res, next) {
      const arity = handler.length;
      try {
        if (err && arity === 4) {
          // error handling middleware
          handler(err, req, res, next);
        } else if (!err && arity < 4) {
          // request handling middleware
          handler(req, res, next);
        } else {
          next(err);
        }
      } catch (e) {
        next(e);
      }
    }

    let index = 0;

    _next();
  }

  const stack = [];

  app.use = function(handler) {
    stack.push(handler);
  };

  return app;
};
