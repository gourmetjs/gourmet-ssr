import React, {Component} from "react";
import Helmet from "react-helmet";
import cx from "classnames";
import Navbar from "../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "./BrandPage.css";

export default class BrandPage extends Component {
  state = {isScrolled: false};

  handleScroll = () => this.setState({isScrolled: window.pageYOffset >= 70});

  componentDidMount() {
    window.addEventListener("scroll", this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener("scroll", this.handleScroll);
  }

  render() {
    const {children} = this.props;
    return (
      <>
        <Helmet>
          <title>Gourmet</title>
        </Helmet>
        <Navbar
          className={cx("fixed-top navbar-light navbar-expand-lg", {scrolled: this.state.isScrolled})}
          brand="Gourmet"
          href="/"
          tagLine="SSR"/>
        <div className="container">
          {children}
        </div>
      </>
    );
    }
}
