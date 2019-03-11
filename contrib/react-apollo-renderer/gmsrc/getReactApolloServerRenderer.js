"use strict";

const React = require("react");
const promiseProtect = require("@gourmet/promise-protect");
const selfUrl = require("@gourmet/self-url");
const {ApolloClient} = require("apollo-client");
const {InMemoryCache} = require("apollo-cache-inmemory");
const {onError} = require("apollo-link-error");
const {ApolloLink} = require("apollo-link");
const {HttpLink} = require("apollo-link-http");
const {ApolloProvider, getDataFromTree} = require("react-apollo");
const handleLinkError = require("./handleLinkError");

// Options:
// - `apolloClient = {connectToDevTools: false, ssrForceFetchDelay: 100}`: An options object for `ApolloClient`.
// - `apolloHttpLink = undefined`: An options object for `ApolloLinkHttp`.
// - `apolloInMemoryCache = undefined`: An options object for `ApolloInMemoryCache`.
// * `apolloHttpLink.uri` is converted to an absolute URL using `@gourmet/self-url`.
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
        element = (
          <ApolloProvider client={gmctx.apolloClient}>
            {element}
          </ApolloProvider>
        );
        return getDataFromTree(element).then(() => {
          gmctx.data.apolloState = gmctx.apolloClient.cache.extract();
          return element;
        });
      });
    }

    createApolloClient(gmctx) {
      const uri = this.options.apolloLinkHttp && this.options.apolloLinkHttp.uri;
      return new ApolloClient(Object.assign({
        connectToDevTools: false,
        ssrForceFetchDelay: 100
      }, this.options.apolloClient, {
        ssrMode: true,
        link: ApolloLink.from([
          onError(handleLinkError),
          new HttpLink(Object.assign({}, this.options.apolloLinkHttp, {
            uri: selfUrl(gmctx, uri || "/graphql")
          }))
        ]),
        cache: new InMemoryCache(this.options.apolloInMemoryCache)
      }, this.options.apolloClient));
    }
  };
};
