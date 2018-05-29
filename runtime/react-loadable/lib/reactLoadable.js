// This source code is based on https://github.com/jamiebuilds/react-loadable
"use strict";

const React = require("react");
const PropTypes = require("prop-types");

const ALL_INITIALIZERS = [];
const READY_INITIALIZERS = [];

function isWebpackReady(moduleIds) {
  /* global __webpack_modules__ */
  if (typeof __webpack_modules__ !== "object")
    return false;

  return moduleIds.every(moduleId => {
    return (
      typeof moduleId !== "undefined" &&
      typeof __webpack_modules__[moduleId] !== "undefined"
    );
  });
}

function load(loader) {
  const promise = loader();

  const state = {
    loading: true,
    loaded: null,
    error: null
  };

  state.promise = promise.then(loaded => {
    state.loading = false;
    state.loaded = loaded;
    return loaded;
  }).catch(err => {
    state.loading = false;
    state.error = err;
    throw err;
  });

  return state;
}

function resolve(obj) {
  return obj && obj.__esModule ? obj.default : obj;
}

function render(loaded, props) {
  return React.createElement(resolve(loaded), props);
}

function loadable(loader, options) {
  const info = Object.assign({
    loading: null,
    delay: 200,
    timeout: null,
    render,
    webpack: null,
    modules: null,
    preload: true,
    caller: null
  }, options);

  let res = null;

  info.init = function() {
    if (!res)
      res = load(loader);
    return res.promise;
  };

  register(info);

  /* eslint-disable react/no-deprecated */
  class LoadableComponent extends React.Component {
    constructor(props) {
      super(props);

      info.init();

      this.state = {
        error: res.error,
        pastDelay: false,
        timedOut: false,
        loading: res.loading,
        loaded: res.loaded
      };
    }

    static load() {
      return info.init();
    }

    componentWillMount() {
      this._mounted = true;
      this._loadModule();
    }

    _loadModule() {
      const gmctx = this.context.gmctx;

      if (gmctx && gmctx.isServer) {
        if (gmctx.data.loadable.componentsId)
          gmctx.data.loadable.componentsId.push(info.id);
        else
          gmctx.data.loadable.componentsId = [info.id];

        if (info.preload && Array.isArray(info.modules)) {
          info.modules.forEach(path => {
            gmctx.preloadModule(path);
          });
        }
      }

      if (!res.loading)
        return;

      if (typeof info.delay === "number") {
        if (info.delay === 0) {
          this.setState({pastDelay: true});
        } else {
          this._delay = setTimeout(() => {
            this.setState({pastDelay: true});
          }, info.delay);
        }
      }

      if (typeof info.timeout === "number") {
        this._timeout = setTimeout(() => {
          this.setState({timedOut: true});
        }, info.timeout);
      }

      const update = () => {
        if (!this._mounted)
          return;

        this.setState({
          error: res.error,
          loaded: res.loaded,
          loading: res.loading
        });

        this._clearTimeouts();
      };

      res.promise.then(update).catch(update);
    }

    componentWillUnmount() {
      this._mounted = false;
      this._clearTimeouts();
    }

    _clearTimeouts() {
      clearTimeout(this._delay);
      clearTimeout(this._timeout);
    }

    retry() {
      this.setState({error: null, loading: true});
      res = load(loader);
      this._loadModule();
    }

    render() {
      if (this.state.loading || this.state.error) {
        return React.createElement(info.loading, {
          isLoading: this.state.loading,
          pastDelay: this.state.pastDelay,
          timedOut: this.state.timedOut,
          error: this.state.error,
          retry: this.retry.bind(this)
        });
      } else if (this.state.loaded) {
        return info.render(this.state.loaded, this.props);
      } else {
        return null;
      }
    }
  }

  LoadableComponent.contextTypes = {
    gmctx: PropTypes.object
  };

  return LoadableComponent;
}

function flushInitializers(initializers) {
  const promises = [];

  while (initializers.length) {
    const init = initializers.pop();
    promises.push(init());
  }

  return Promise.all(promises).then(() => {
    if (initializers.length)
      return flushInitializers(initializers);
  });
}

loadable.preloadAll = () => {
  return new Promise((resolve, reject) => {
    flushInitializers(ALL_INITIALIZERS).then(resolve, reject);
  });
};

loadable.preloadReady = () => {
  return new Promise(resolve => {
    // We always will resolve, errors should be handled within loading UIs.
    flushInitializers(READY_INITIALIZERS).then(resolve, resolve);
  });
};

module.exports = loadable;
