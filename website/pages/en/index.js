/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");

const MarkdownBlock = CompLibrary.MarkdownBlock; /* Used to read markdown */
const Container = CompLibrary.Container;
const GridBlock = CompLibrary.GridBlock;

class HomeSplash extends React.Component {
  render() {
    const {siteConfig, language = ""} = this.props;
    const {baseUrl, docsUrl} = siteConfig;
    const docsPart = `${docsUrl ? `${docsUrl}/` : ""}`;
    const langPart = `${language ? `${language}/` : ""}`;
    const docUrl = doc => `${baseUrl}${docsPart}${langPart}${doc}`;

    const SplashContainer = props => (
      <div className="homeContainer">
        <div className="homeSplashFade">
          <div className="wrapper homeWrapper">{props.children}</div>
        </div>
      </div>
    );

    const ProjectTitle = () => (
      <h2 className="projectTitle">
        <img className="logo" src={`${baseUrl}img/gourmet-ssr-dark.svg`} alt={siteConfig.title}/>
        <small>{siteConfig.tagline}</small>
      </h2>
    );

    const PromoSection = props => (
      <div className="section promoSection">
        <div className="promoRow">
          <div className="pluginRowBlock">{props.children}</div>
        </div>
      </div>
    );

    const Button = props => (
      <div className="pluginWrapper buttonWrapper">
        <a className="button large" href={props.href} target={props.target}>
          {props.children}
        </a>
      </div>
    );

    return (
      <SplashContainer>
        <div className="inner">
          <ProjectTitle siteConfig={siteConfig}/>
          <PromoSection>
            <Button href={docUrl("getting-started.html")}>GET STARTED</Button>
          </PromoSection>
        </div>
      </SplashContainer>
    );
  }
}

const HOW_IT_WORKS = [[
`
> You write the user interface without complicated bootstrapping or boilerplate.
> It is just a plain tree of React components.
`, `
\`\`\`js
// hello.js
import React from "react";

export default function Hello({greeting}) {
  return <div>{greeting}</div>;
}
\`\`\`
`
], [
`
> Configuration is designed to be minimal, but not to the level of "magic".
> Here, we specify the React component above as a root component of \`main\` page.
`, `
\`\`\`js
// gourmet_config.js
module.exports = {
  pages: {
    main: "./hello.js"
  }
};
\`\`\`
`
], [
`
> Build
`, `
\`\`\`bash
$ gourmet build
\`\`\`
`
], [
`
> Gourmet SSR is just a view library in your server.
> Here, you render and serve the \`main\` page by calling \`res.serve()\`.
`, `
\`\`\`js
// server.js
const express = require("express");
const gourmet = require("@gourmet/client-lib");

const app = express();

app.use(gourmet.middleware());

app.get("/", (req, res) => {
  res.serve("main", {greeting: "Hello, world!"});
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
\`\`\`
`
], [
`
> Server rendered content
`, `
\`\`\`bash
$ curl http://localhost:3000
<!doctype html>
<html lang="en">
  <head>
    <script defer src="/s/vendors~main.js"></script>
    <script defer src="/s/main.js"></script>
  </head>
  <body>
    <div id="__gourmet_content__"><div id="__gourmet_react__"><div>Hello, world!</div></div></div>
    <script>window.__gourmet_data__={"renderedLoadables":[],"clientProps":{"greeting":"Hello, world!"},"reactClientRender":"hydrate"};</script>
  </body>
</html>
\`\`\`
`
]];

class Index extends React.Component {
  render() {
    const {config: siteConfig, language = ""} = this.props;
    const {baseUrl} = siteConfig;

    const Block = props => (
      <Container
        padding={["bottom", "top"]}
        id={props.id}
        background={props.background}>
        <GridBlock
          align="center"
          contents={props.children}
          layout={props.layout}
        />
      </Container>
    );

    const Features = () => (
      <Block layout="fourColumn" background="light">
        {[{
          content: "This is the content of my feature",
          image: `${baseUrl}img/chip.svg`,
          imageAlign: "top",
          title: "Library, not Framework",
        }, {
          content: "The content of my second feature",
          image: `${baseUrl}img/rocket.svg`,
          imageAlign: "top",
          title: "Production First",
        }, {
          content: "The content of my second feature",
          image: `${baseUrl}img/developer.svg`,
          imageAlign: "top",
          title: "Human Friendly",
        }, {
          content: "View-layer & server architecture agnostic. Vue, Angular, Lambda, Django",
          image: `${baseUrl}img/mixer.svg`,
          imageAlign: "top",
          title: "Flexible",
        }]}
      </Block>
    );

    const HowItWorks = () => (
      <Container
        padding={["bottom", "top"]}>
        {HOW_IT_WORKS.map(([desc, code], idx) => (
          <div className="gridBlock" key={idx}>
            <div className="blockElement descByGridBlock">
              <MarkdownBlock>{desc}</MarkdownBlock>
            </div>
            <div className="blockElement codeByGridBlock">
              <MarkdownBlock>{code}</MarkdownBlock>
            </div>
          </div>
        ))}
      </Container>
    );

    return (
      <div>
        <HomeSplash siteConfig={siteConfig} language={language}/>
        <div className="mainContainer">
          <Features/>
          <HowItWorks/>
        </div>
      </div>
    );
  }
}

module.exports = Index;
