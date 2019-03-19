"use strict";

const React = require("react");
const promiseProtect = require("@gourmet/promise-protect");
const merge = require("@gourmet/merge");
const {ApolloClient} = require("apollo-client");
const {InMemoryCache} = require("apollo-cache-inmemory");
const {onError} = require("apollo-link-error");
const {ApolloLink} = require("apollo-link");
const {HttpLink} = require("apollo-link-http");
const {ApolloProvider} = require("react-apollo");
const handleLinkError = require("./handleLinkError");

let apolloClient;

module.exports = function getClientRenderer(Base) {
  if (!Base)
    throw Error("`@gourmet/react-apollo-renderer` cannot be the first one in the renderer chain. Check your configuration.");

  return class ApolloClientRenderer extends Base {
    prepareToRender(gmctx) {
      return promiseProtect(() => {
        return super.prepareToRender(gmctx);
      }).then(cont => {
        if (!apolloClient)
          apolloClient = this.createApolloClient(gmctx);
        gmctx.apolloClient = apolloClient;
        return cont;
      });
    }

    invokeUserRenderer(gmctx) {
      return promiseProtect(() => {
        return super.invokeUserRenderer(gmctx);
      }).then(element => {
        return (
          <ApolloProvider client={gmctx.apolloClient}>
            {element}
          </ApolloProvider>
        );
      });
    }

    createApolloClient(gmctx) {
      // Apollo options are specified in `builder.initOptions.apollo`, which is copied from `apollo`
      // at build time by the `@gourmet/plugin-react-apollo`.
      // The root base class of the renderers chain stores the `initOptions` in `this.options`.
      // We create a deep copy to allow in-place modification in the page component's `createApolloClient`.
      const options = merge({
        client: {
          connectToDevTools: false
        },
        linkHttp: {
          uri: "/graphql"
        },
        cacheInMemory: {}
      }, this.options.apollo);

      if (this.userObject.createApolloClient) {
        const apollo = this.userObject.createApolloClient(gmctx, options);
        if (apollo)
          return apollo;
      }

      const cache = new InMemoryCache(options.cacheInMemory);

      if (gmctx.data.apolloState)
        cache.restore(gmctx.data.apolloState);

      return new ApolloClient(Object.assign({}, options.client, {
        ssrMode: false,
        link: ApolloLink.from([
          onError(handleLinkError),
          new HttpLink(options.linkHttp)
        ]),
        cache
      }));
    }
  };
};
