"use strict";

module.exports = function handleLinkError({graphQLErrors, networkError}) {
  if (graphQLErrors) {
    graphQLErrors.map(({message, locations, path}) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      ),
    );
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
};
