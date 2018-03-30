import "bootstrap/dist/css/bootstrap.min.css";
import "ionicons/css/ionicons.min.css";
import React, {PureComponent} from "react";
import {hot} from "react-hot-loader";
import {prepared} from "react-prepare";
import HelloApp from "./HelloApp";

let _app;

class _HelloRoot extends PureComponent {
  // TEMPORARY!!
  componentDidMount() {
    _app = this;
  }

  componentWillUnmount() {
    _app = null;
  }

  render() {
    return <HelloApp user={this.props.gmctx.data.user}/>;
  }
}

const HelloRoot = prepared(({gmctx}) => {
  if (!gmctx.data.user) {
    console.log("simulating data fetch...");
    return (new Promise(resolve => {
      setTimeout(() => {
        resolve({
          displayName: "John Doe",
          emails: [
            "john@example.com",
            "john.doe@gmail.com"
          ],
          url: "http://gourmetjs.com",
          company: "Gourmet Tech Inc.",
          location: "San Jose, California",
          photoUrl: null
        });
      }, 500);
    })).then(user => {
      gmctx.data.user = user;
      if (_app)
        _app.forceUpdate();
    }).catch(err => {
      console.error("fetch error:", err);
      throw err;
    });
  }
}, {
  componentWillReceiveProps: false
})(_HelloRoot);

export default hot(module)(HelloRoot);
