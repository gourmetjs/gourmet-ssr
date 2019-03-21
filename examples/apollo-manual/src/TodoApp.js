import React, {Component} from "react";
import selfUrl from "@gourmet/self-url";
import {ApolloClient} from "apollo-client";
import {InMemoryCache} from "apollo-cache-inmemory";
import {HttpLink} from "apollo-link-http";
import {ApolloProvider, getDataFromTree} from "react-apollo";
import TodoMain from "./TodoMain";

let _apollo;

function createApollo(gmctx) {
  const apollo = new ApolloClient({
    ssrMode: gmctx.isServer,
    ssrForceFetchDelay: 100,
    connectToDevTools: false,
    link: new HttpLink({uri: selfUrl(gmctx, "/graphql")}),
    cache: new InMemoryCache()
  });

  if (gmctx.isClient && gmctx.data.apolloState)
    apollo.cache.restore(gmctx.data.apolloState);

  return apollo;
}

function getRenderer(Base) {
  return class ApolloRenderer extends Base {
    prepareToRender(gmctx) {
      return super.prepareToRender(gmctx).then(() => {
        if (gmctx.isServer) {
          gmctx.apolloClient = createApollo(gmctx);
        } else {
          if (!_apollo)
            _apollo = createApollo(gmctx);
          gmctx.apolloClient = _apollo;
        }
      });
    }

    invokeUserRenderer(gmctx) {
      return super.invokeUserRenderer(gmctx).then(element => {
        element = (
          <ApolloProvider client={gmctx.apolloClient}>
            {element}
          </ApolloProvider>
        );
        if (gmctx.isServer) {
          return getDataFromTree(element).then(() => {
            gmctx.data.apolloState = gmctx.apolloClient.cache.extract();
            return element;
          });
        }
        return element;
      });
    }
  };
}

export default class TodoApp extends Component {
  static getServerRenderer = getRenderer;
  static getClientRenderer = getRenderer;

  render() {
    return (
      <div className="container" style={{width: "400px", padding: "10em 0"}}>
        <TodoMain/>
      </div>
    );
  }
}
