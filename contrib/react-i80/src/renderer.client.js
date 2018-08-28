"use strict";

const React = require("react");
const Router = require("./Router");

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
      const url = router.getBrowserUrl();
      return router.setActiveRoute(gmctx, url).then(route => {
        // Only `redirect` makes sense for the client initial rendering.
        if (route.command === "redirect")
          router.goToUrl(route.location);
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
