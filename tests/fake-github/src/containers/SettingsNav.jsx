import React, {PureComponent} from "react";
import {css} from "emotion";
import themeVars from "./themeVars";

const cssNav = css`
  padding: 14px 6px;
  color: ${themeVars.secondary};
`;

const cssHeader = css`
  padding: 8px 8px 8px 16px;
`;

const cssItem = css`
  font-size: .9rem;
  box-sizing: border-box;
  padding: 6px 8px 6px 40px;
  &.active {
    background-color: ${themeVars.light};
    color: $primary;
    border-left: 2px solid ${themeVars.primary};
    padding: 8px 8px 8px 38px;
  }
`;

export default class SettingsNav extends PureComponent {
  render() {
    return (
      <nav className={cssNav}>
        <div className={cssHeader}>
          <i className="icon ion-ios-arrow-down with-text"/>
          Personal settings
        </div>
        <div className={cssItem + " active"}>Profile</div>
        <div className={cssItem}>Account</div>
        <div className={cssItem}>Emails</div>
        <div className={cssItem}>Notifications</div>
        <div className={cssItem}>Billing</div>
        <div className={cssItem}>SSH and GPG keys</div>
        <div className={cssHeader}>
          <i className="icon ion-ios-arrow-down with-text"/>
          Developer settings
        </div>
        <div className={cssItem}>OAuth Apps</div>
        <div className={cssItem}>GitHub Apps</div>
        <div className={cssItem}>GitHub Personal access tokens</div>
        <div className={cssHeader}>
          <i className="icon ion-ios-arrow-down with-text"/>
          Organization settings
        </div>
        <div className={cssItem}>Profile</div>
        <div className={cssItem}>Member privileges</div>
        <div className={cssItem}>Billing</div>
      </nav>
    );
  }
}
