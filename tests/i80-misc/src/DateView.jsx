import React from "react";
import {Link} from "@gourmet/react-i80";

export default function DateView(props) {
  const {params, search} = props;
  return (
    <>
      <div id="year">
        Year: {params[1]}
      </div>
      <div id="month">
        Month: {params[2]}
      </div>
      <div id="day">
        Day: {params[3]}
      </div>
      <div>
        <Link id="main" to="main" search={search}>
          Back to main
        </Link>
      </div>
      <div>
        <Link id="logout" to="account.logout">
          Logout
        </Link>
      </div>
    </>
  );
}
