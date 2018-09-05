import React, {PureComponent} from "react";
import {css} from "emotion";
import Navbar from "reactstrap/lib/Navbar";
import NavbarBrand from "reactstrap/lib/NavbarBrand";
import NavbarToggler from "reactstrap/lib/NavbarToggler";
import Collapse from "reactstrap/lib/Collapse";
import Nav from "reactstrap/lib/Nav";
import NavLink from "reactstrap/lib/NavLink";
import NavItem from "reactstrap/lib/NavItem";
import UncontrolledDropdown from "reactstrap/lib/UncontrolledDropdown";
import DropdownToggle from "reactstrap/lib/DropdownToggle";
import DropdownMenu from "reactstrap/lib/DropdownMenu";
import DropdownItem from "reactstrap/lib/DropdownItem";
import tc from "tinycolor2";
import themeVars from "./themeVars";

const cssMain = css`
  padding:4px 16px;
`;

const cssBrand = css`
  font-size: 1rem;
`;

const cssSearchForm = css`
  width: 12rem;
  margin-left: .8em;
`;

const cssSearchIcon = css`
  padding:0 8px;
`;

const cssSearchInput = css`
  color: white;
  padding: 2px .75rem;
  background-color: ${tc(themeVars.dark).lighten(10).toHexString()};
  &:focus {
    background-color: ${tc(themeVars.dark).lighten(50).toHexString()};
  }
`;

const cssNav = css`
  .nav-item {
    margin-left: .8em;
  }
`;

// We have a specificity issue here
const cssProfileButton = css`
  padding: 0;
`;

const cssProfileIcon = css`
  font-size: 20px;
  margin-right: 4px;
`;

const cssProfileMenu = css`
  width: 220px;
`;

export default class MainNav extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };
  }

  _toggle() {
    this.setState({
      isOpen: !this.state.isOpen
    });
  }

  render() {
    return (
      <Navbar dark color="dark" expand="lg" className={cssMain}>
        <div className="container">
          <NavbarBrand href="http://gourmetjs.com" className={cssBrand}>
            {"{ }"} GOURMET
          </NavbarBrand>
          <NavbarToggler onClick={() => this._toggle()}/>
          <Collapse isOpen={this.state.isOpen} navbar>
            <form className={"form-inline" + cssSearchForm}>
              <div className="input-group">
                <div className="input-group-prepend">
                  <i className={"input-group-text icon ion-search " + cssSearchIcon}/>
                </div>
                <input className={"form-control " + cssSearchInput} type="search" placeholder="Search"/>
              </div>
            </form>
            <Nav navbar className={cssNav}>
              <NavItem>
                <NavLink href="#">
                  <i className="icon ion-pull-request with-text"/>
                  Pull request
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="#">
                  <i className="icon ion-alert-circled with-text"/>
                  Issues
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="#">
                  <i className="icon ion-ios-cart-outline with-text"/>
                  Marketplace
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink href="#">
                  <i className="icon ion-plane with-text"/>
                  Explore
                </NavLink>
              </NavItem>
            </Nav>
            <Nav navbar className="ml-auto">
              <UncontrolledDropdown nav>
                <DropdownToggle nav caret className={cssProfileButton}>
                  <i className={"icon ion-person " + cssProfileIcon}/>
                </DropdownToggle>
                <DropdownMenu right className={cssProfileMenu}>
                  <DropdownItem header>
                    Signed in as <strong>johndoe</strong>
                  </DropdownItem>
                  <DropdownItem divider/>
                  <DropdownItem>
                    <i className="icon ion-person with-text"/>
                    Your profile
                  </DropdownItem>
                  <DropdownItem>
                    <i className="icon ion-star with-text"/>
                    Your stars
                  </DropdownItem>
                  <DropdownItem>
                    <i className="icon ion-ios-list-outline with-text"/>
                    Your gists
                  </DropdownItem>
                  <DropdownItem divider />
                  <DropdownItem>
                    <i className="icon ion-help with-text"/>
                    Help
                  </DropdownItem>
                  <DropdownItem>
                    <i className="icon ion-gear-a with-text"/>
                    Settings
                  </DropdownItem>
                  <DropdownItem>
                    <i className="icon ion-log-out with-text"/>
                    Sign out
                  </DropdownItem>
                </DropdownMenu>
              </UncontrolledDropdown>
            </Nav>
          </Collapse>
        </div>
      </Navbar>
    );
  }
}
