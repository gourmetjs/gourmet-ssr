/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

class Footer extends React.Component {
  render() {
    return (
      <footer className="nav-footer" id="footer">
        <section className="sitemap">
          <a href={this.props.config.baseUrl} className="nav-home">
            {this.props.config.footerIcon && (
              <img
                src={this.props.config.baseUrl + this.props.config.footerIcon}
                alt={this.props.config.title}
              />
            )}
          </a>
          <div>
          </div>
          <div>
            <h5>Docs</h5>
            <a href="/docs/getting-started">
              Getting Started
            </a>
            <a href="/docs/tutorial-1">
              Tutorial
            </a>
          </div>
          <div>
            <h5>Social</h5>
            <a href="https://github.com/gourmetjs/gourmet-ssr">
              GitHub
            </a>
          </div>
        </section>
        <section className="copyright">
          {this.props.config.copyright}
        </section>
      </footer>
    );
  }
}

module.exports = Footer;
