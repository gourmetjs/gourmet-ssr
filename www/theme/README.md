## How to build a custome theme

This theme is based on Bootswatch Cosmo.
Only change that were made from the original is removing the Google Web Font.
We prefer the default Bootstrap font configuration for better performance.

1. Clone the Bootswatch repo to a temporary directory out of this repo.
2. Copy `_bootswatch.scss` and `_variables.scss` from this directory to `${bootswatch}/dist/cosmo`.
3. Run `./node_modules/.bin/grunt swatch:cosmo` at Bootswatch directory.
4. Copy the built files (`bootstrap.css` & `bootstrap.min.css`) back to this directory.
