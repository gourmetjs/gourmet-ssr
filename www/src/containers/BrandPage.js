import React, {Component} from "react";
import Helmet from "react-helmet";
import cx from "classnames";
import Navbar from "../components/Navbar";
import "../../theme/bootstrap.min.css";
import logo from "../images/gourmet-ssr.svg";
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
          <title>Gourmet SSR | A JavaScript server-side rendering engine for professionals</title>
        </Helmet>
        <Navbar
          className={cx("fixed-top navbar-light navbar-expand-md", {scrolled: this.state.isScrolled})}
          brand={<img src={logo} height="24" alt="Gourmet SSR Logo"/>}
          href="/"/>
        <div className="container">
          {children}
        </div>
      </>
    );
    }
}
