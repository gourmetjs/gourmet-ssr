import React, {PureComponent} from "react";
import Helmet from "react-helmet";
import Navbar from "../components/Navbar";

export default class IndexPage extends PureComponent {
  render() {
    return (
      <div>
        <Helmet>
          <title>Gourmet</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous"/>
        </Helmet>
        <Navbar
          brand="Gourmet"
          href="/"
          tagLine="JavaScript"/>
      </div>
    )
  }
}
