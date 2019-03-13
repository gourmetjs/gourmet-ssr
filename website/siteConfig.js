/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in theq
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

const siteConfig = {
  title: "Gourmet SSR", // Title for your website.
  tagline: "A Server-Side Rendering Engine for Professionals",
  url: "https://ssr.gourmetjs.org", // Your website URL
  baseUrl: "/", // Base URL for your project */
  // For github.io type URLs, you would set the url and baseUrl like:
  //   url: "https://facebook.github.io",
  //   baseUrl: "/test-site/",

  // This will create CNAME file
  cname: "ssr.gourmetjs.org",

  editUrl: "https://github.com/gourmetjs/gourmet-ssr/blob/master/docs/",

  // Used for publishing and more
  projectName: "gourmet-ssr",
  organizationName: "gourmetjs",
  // For top-level user or org sites, the organization is still the same.
  // e.g., for the https://JoelMarcey.github.io site, it would be set like...
  //   organizationName: "JoelMarcey"

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    {doc: "getting-started", label: "Getting Started"},
    {doc: "tutorial-1", label: "Tutorial"},
    {doc: "tutorial-1", label: "Docs"},
    {href: "https://github.com/gourmetjs/gourmet-ssr", label: "GitHub"},
    //{page: "help", label: "Help"},
    //{blog: true, label: "Blog"},
  ],

  /* path to images for header/footer */
  headerIcon: "img/gourmet-ssr.svg",
  footerIcon: "img/gourmet-ssr.svg",
  favicon: "img/favicon.png",

  /* Colors for website */
  colors: {
    primaryColor: "#0366d6",
    secondaryColor: "#044289",
  },

  /* Custom fonts for website */
  /*
  fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },
  */

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} Gourmet Tech Inc.`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: "atom-one-dark"
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: [
    "https://buttons.github.io/buttons.js",
    "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js",
    "/js/code-block-buttons.js"
  ],

/*
  // Apparently, Docusaurus automatically scans the CSS files in `static/css` and embed them in `main.css`.
  // If we specify CSS files here, they will end up being duplicated.
  stylesheets: [
    "/css/prism-custom.css",
    "/css/code-block-buttons.css"
  ],
*/

  // On page navigation for the current documentation page.
  onPageNav: "separate",
  // No .html extensions for paths.
  cleanUrl: true,

  // Show documentation"s last contributor"s name.
  // enableUpdateBy: true,

  // Show documentation"s last update time.
  enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo"s URL...
  //   repoUrl: "https://github.com/facebook/test-site",

  usePrism: true,

  // Enable Google Analytics
  gaTrackingId: "UA-78769505-3",
  gaGtag: true,

  // Enable Algolia DocSearch
  algolia: {
    apiKey: "9532e95a0b475b0b83bfd5e5374cfdf0",
    indexName: "gourmetjs_ssr"
  }
};

module.exports = siteConfig;
