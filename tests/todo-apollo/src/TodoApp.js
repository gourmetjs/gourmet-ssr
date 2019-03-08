import React, {Component} from "react";
import promiseProtect from "@gourmet/promise-protect";
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import {onError} from "apollo-link-error";
import {ApolloLink} from "apollo-link";
import {HttpLink} from "apollo-link-http";
import {ApolloProvider, getDataFromTree} from "react-apollo";
import TodoLoadable from "./TodoLoadable";

function _createApolloClient(gmctx) {
  const cache = new InMemoryCache();

  if (gmctx.isClient && gmctx.data.apolloState)
    cache.restore(gmctx.data.apolloState);

  return new ApolloClient({
    ssrMode: gmctx.isServer,
    ssrForceFetchDelay: 100,
    connectToDevTools: false,
    link: ApolloLink.from([
      onError(({graphQLErrors, networkError}) => {
        if (graphQLErrors) {
          graphQLErrors.map(({message, locations, path}) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            ),
          );
        }
        if (networkError) {
          console.log(`[Network error]: ${networkError}`);
        }
      }),
      new HttpLink({
        uri: "http://localhost:3000/graphql"
      })
    ]),
    cache
  });
}

function getServerRenderer(Base) {
  return class ApolloServerRenderer extends Base {
    prepareToRender(gmctx) {
      return Promise.all([
        super.prepareToRender(gmctx),
        _createApolloClient(gmctx)
      ]).then(([cont, apollo]) => {
        gmctx.apolloClient = apollo;
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
  };
}

function getClientRenderer(Base) {
  return class ApolloClientRenderer extends Base {
    prepareToRender(gmctx) {
      return Promise.all([
        super.prepareToRender(gmctx),
        _createApolloClient(gmctx)
      ]).then(([cont, apollo]) => {
        gmctx.apolloClient = apollo;
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
  };
}

export default class TodoApp extends Component {
  static getServerRenderer = getServerRenderer;
  static getClientRenderer = getClientRenderer;

  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoLoadable/>
      </div>
    );
  }
}
