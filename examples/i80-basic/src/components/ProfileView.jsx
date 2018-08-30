import React from "react";

function ProfileView(props) {
  return <h1>{props.label} {props.route.getDisplayName()}</h1>;
}

ProfileView.routeDisplayName = "Profile";

export default ProfileView;
