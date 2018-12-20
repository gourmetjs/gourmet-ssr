import React, {PureComponent} from "react";

export default class Navbar extends PureComponent {
  render() {
    const {brand, href, tagLine} = this.props;
    return (
      <nav className="navbar navbar-expand-lg navbar-light bg-light navbar-fixed-top">
        <div className="container">
          {brand && <a className="navbar-brand" href={href}>{brand}</a>}
          {tagLine && <span class="navbar-tagline hidden-sm">JavaScript</span>}
          <button className="navbar-toggler" type="button">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse">
            <ul className="navbar-nav mr-auto">
            <li className="nav-item">
                <a className="nav-link" href="/docs">Getting started</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/tutorial">Tutorial</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="/docs">Docs</a>
              </li>
            </ul>
            <form className="form-inline my-2 my-lg-0">
              <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search"/>
              <button className="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
            </form>
          </div>
        </div>
      </nav>
    );
  }
}
