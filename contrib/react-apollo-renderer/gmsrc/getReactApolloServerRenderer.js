"use strict";

const React = require("react");
const promiseProtect = require("@gourmet/promise-protect");
const merge = require("@gourmet/merge");
const selfUrl = require("@gourmet/self-url");
const {ApolloClient} = require("apollo-client");
const {InMemoryCache} = require("apollo-cache-inmemory");
const {onError} = require("apollo-link-error");
const {ApolloLink} = require("apollo-link");
const {HttpLink} = require("apollo-link-http");
const {ApolloProvider, getDataFromTree} = require("react-apollo");
const handleLinkError = require("./handleLinkError");

module.exports = function getServerRenderer(Base) {
  return class ApolloServerRenderer extends Base {
    prepareToRender(gmctx) {
      return promiseProtect(() => {
        return super.prepareToRender(gmctx);
      }).then(cont => {
        gmctx.apolloClient = this.createApolloClient(gmctx);
        return cont;
      });
    }

    invokeUserRenderer(gmctx) {
      return promiseProtect(() => {
        return super.invokeUserRenderer(gmctx);
      }).then(element => {
        if (gmctx.apolloClient) {
          element = (
            <ApolloProvider client={gmctx.apolloClient}>
              {element}
            </ApolloProvider>
          );
          if (gmctx.apolloClient.cache && typeof gmctx.apolloClient.cache.extract === "function") {
            return getDataFromTree(element).then(() => {
              gmctx.data.apolloState = gmctx.apolloClient.cache.extract();
              return element;
            });
          }
        }
        return element;
      });
    }

    createApolloClient(gmctx) {
      // Apollo options are specified in `builder.initOptions.apollo`, which is copied from `apollo`
      // at build time by the `@gourmet/plugin-react-apollo`.
      // The root base class of the renderers chain stores the `initOptions` in `this.options`.
      // We create a deep copy to allow in-place modification in the page component's `createApolloClient`.
      const options = merge({
        // An options object for `apollo-client`
        client: {
          connectToDevTools: false,
          ssrForceFetchDelay: 100
        },
        // An options object for `apollo-link-http`.
        linkHttp: {
          uri: "/graphql"   // This will be converted to an absolute URL using `@gourmet/self-url`
        },
        // An options object for `apollo-cache-inmemory`
        cacheInMemory: {}
      }, this.options.apollo);

      options.linkHttp.uri = selfUrl(gmctx, options.linkHttp.uri);

      let apollo;

      if (this.userObject.createApolloClient)
        apollo = this.userObject.createApolloClient(gmctx, options);

      if (apollo === undefined) {
        apollo = new ApolloClient(Object.assign({}, options.client, {
          ssrMode: true,
          link: ApolloLink.from([
            onError(handleLinkError),
            new HttpLink(options.linkHttp)
          ]),
          cache: new InMemoryCache(options.cacheInMemory)
        }));
      }

      return apollo;
    }
  };
};
