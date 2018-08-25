"use strict";

const React = require("react");
const Router = require("./Router");
const qs = require("./querystring");

class I80ClientWrapper extends React.Component {
  componentDidMount() {
    this.props.router.clientDidMount(this.props.gmctx, this);
  }

  componentWillUnmount() {
    this.props.router.clientWillUnmount(this.props.gmctx, this);
  }

  render() {
    return this.props.children;
  }
}

module.exports = function(Base) {
  if (!Base)
    throw Error("`@gourmet/react-i80` cannot be the first one in the renderer chain. Check your configuration.");

  return class I80ClientRenderer extends Base {
    createContext() {
      const gmctx = super.createContext();
      gmctx.routerData = {initialProps: {}};
      return gmctx;
    }

    invokeUserRenderer(gmctx) {
      const router = Router.get();
      const loc = window.location;
      const url = {
        path: loc.pathname,
        query: qs(loc.search),
        hash: loc.hash
      };
      return router.setActiveRoute(gmctx, url).then(() => {
        return super.invokeUserRenderer(gmctx).then(element => {
          return (
            <I80ClientWrapper gmctx={gmctx} router={router}>
              {element}
            </I80ClientWrapper>
          );
        });
      });
    }
  };
};
