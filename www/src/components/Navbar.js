import React, {Component} from "react";
import Collapse from "./Collapse";
import cx from "classnames";

export default class BrandPage extends Component {
  state = {isOpen: true};

  render() {
    const {className, brand, href, tagLine} = this.props;
    return (
      <nav className={cx("navbar", className)}>
        <div className="container">
          {brand && <a className="navbar-brand" href={href}>{brand}</a>}
          {tagLine && <span className="navbar-tagline hidden-sm">{tagLine}</span>}
          {this.renderToggler()}
          <Collapse className="navbar-collapse" isOpen={this.state.isOpen}>
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
          </Collapse>
        </div>
      </nav>
    );
  }

  renderToggler() {
    return (
      <button
        className={cx("navbar-toggler", {collapsed: this.state.isOpen})}
        type="button"
        onClick={this.handleToggle}
      >
        <span className="navbar-toggler-icon"/>
      </button>
    );
  }

  handleToggle = () => {
    this.setState({isOpen: !this.state.isOpen});
  }
}
