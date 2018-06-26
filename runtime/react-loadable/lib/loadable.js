"use strict";

const React = require("react");
const PropTypes = require("prop-types");
const registrar = require("@gourmet/loadable-registrar");

function render(loaded, props) {
  return React.createElement(loaded && loaded.__esModule ? loaded.default : loaded, props);
}

function Loading(props) {
  if (props.error) {
    return React.createElement(
      "div",
      null,
      props.error.message || props.error
    );
  } else if (props.timedOut) {
    return React.createElement(
      "div",
      null,
      "Couldn't load the component, timed out!"
    );
  } else if (props.pastDelay) {
    return React.createElement(
      "div",
      null,
      "Loading..."
    );
  } else {
    return null;
  }
}

function loadable(options) {
  const info = Object.assign({
    loader: null,
    loading: Loading,
    delay: 200,
    timeout: null,
    render,
    modules: null   // automatically populated by a Babel plugin
  }, options);

  let res;

  if (!info.loader)
    throw Error("`loader` is required");

  info.init = function() {
    if (!res) {
      const promise = info.loader();

      res = {
        loading: true,
        loaded: null,
        error: null
      };

      res.promise = promise.then(loaded => {
        res.loading = false;
        res.loaded = loaded;
        return loaded;
      }).catch(err => {
        res.loading = false;
        res.error = err;
        throw err;
      });
    }

    return res.promise;
  };

  registrar.add(info);

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

    static preload() {
      return info.init();
    }

    componentWillMount() {
      this._mounted = true;
      this._loadModule();
    }

    _loadModule() {
      const gmctx = this.context.gmctx;

      if (gmctx && gmctx.isServer && info.id)
        gmctx.addRenderedLoadable(info.id);

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
      res = null;
      info.init();
      this.setState({error: null, loading: true});
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

module.exports = loadable;
