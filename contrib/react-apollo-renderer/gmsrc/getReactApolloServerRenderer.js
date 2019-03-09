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

module.exports = function getServerRenderer(Base) {
  return class ApolloServerRenderer extends Base {
    constructor(userObject, options) {
      super(userObject, {
        // Options for `ApolloClient`
        apolloClient: {
          ssrMode: true,
          ssrForceFetchDelay: 100,
          connectToDevTools: false,
          ...(options && options.apolloClient)
        },

        apolloHttpLink: {
          uri: "/graphql",
          ...(options && options.apolloHttpLink)
        },

        ...options
      });
    }

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
      return new ApolloClient({
        link: ApolloLink.from([
          onError(handleLinkError),
          new HttpLink(Object.assign({}, this.options.apolloHttpLink, {
            uri: selfUrl(gmctx, this.options.apolloHttpLink.uri)
          }))
        ]),
        cache: new InMemoryCache()
      });
    }
  };
};
