"use strict";

const React = require("react");
const promiseProtect = require("@gourmet/promise-protect");
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
    constructor(userObject, options) {
      super(userObject, {
        // True if a new instance of Apollo Client must created per a rendering session (e.g. route change) on the browser.
        // On the server-side, a new instance is always created per a request, so this option is not used.
        createNewApolloClient: false,

        // Options for `ApolloClient`
        apolloClient: {
          ssrMode: false,
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
        if (this.options.apollo.createNewApolloClient) {
          gmctx.apolloClient = this.createApolloClient(gmctx);
        } else {
          if (!apolloClient)
            apolloClient = this.createApolloClient(gmctx);
          gmctx.apolloClient = apolloClient;
        }
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
      const cache = new InMemoryCache();
    
      if (gmctx.data.apolloState)
        cache.restore(gmctx.data.apolloState);
    
      return new ApolloClient(Object.assign({
        link: ApolloLink.from([
          onError(handleLinkError),
          new HttpLink(this.options.apolloHttpLink)
        ]),
        cache
      }, this.options.apolloClient));
    }
  };
};
