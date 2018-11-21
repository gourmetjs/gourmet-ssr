## Test runner for a standalone mode

This project is to run projects under `tests` directory in standalone mode without using Lerna.

Note that this creates a temporary directory `.gourmet-standalone` at the same level as `gourmet-ssr`.

```sh
npm install
npm run copy-all    # Copy packages to the temporary directory
npm run install-all # Runs `npm install` or `yarn install` on all packages
npm run test-all    # Runs `npm test` or `yarn test` on all packages
```
