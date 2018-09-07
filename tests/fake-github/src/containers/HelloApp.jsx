import "bootstrap/dist/css/bootstrap.min.css";
import "ionicons/css/ionicons.min.css";
import React, {PureComponent} from "react";
import {injectGlobal, css} from "emotion";
import Container from "../components/Container";
import MainNav from "./MainNav";
import SettingsNav from "./SettingsNav";
import ProfilePanel from "./ProfilePanel";

const CONTAINER_WIDTH = 960;

injectGlobal`
  body {
    padding: 0;
    margin: 0;
    /*font-size: .9rem;*/
  }

  .icon.with-text {
    margin-right: 0.4rem;
  }

  .container {
    max-width: ${CONTAINER_WIDTH}px;
  }

  .alert.with-icon {
    padding-left: 3rem;
  }

  .alert.with-icon i {
    font-size: 1.5rem;
    position: absolute;
    left: 1rem;
    top: .5rem;
  }
`;

const cssMain = css`
  padding: 20px 0;
`;

const cssContainer = css`
  display: flex;
  align-items: flex-start;
`;

const cssSideNav = css`
  flex: none;
  width: 240px;
  box-sizing: border-box;
  border: 1px solid #ccc;
`;

const cssPanel = css`
  flex: auto;
  padding: 0 30px;
`;

export default class HelloApp extends PureComponent {
  static getInitialProps() {
    console.log("simulating data fetch...");
    return (new Promise(resolve => {
      setTimeout(() => {
        resolve({
          user: {
            displayName: "John Doe",
            emails: [
              "john@example.com",
              "john.doe@gmail.com"
            ],
            url: "http://gourmetjs.com",
            company: "Gourmet Tech Inc.",
            location: "San Jose, California",
            photoUrl: null
          }
        });
      }, 500);
    }));
  }

  render() {
    const user = this.props.user;
    return (
      <div>
        <MainNav/>
        <div className={cssMain}>
          <Container width={CONTAINER_WIDTH} className={cssContainer}>
            <div className={cssSideNav}>
              <SettingsNav/>
            </div>
            <div className={cssPanel}>
              <ProfilePanel user={user}/>
            </div>
          </Container>
        </div>
      </div>
    );
  }
}
