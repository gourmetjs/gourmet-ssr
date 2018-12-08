import React from "react";
import i80, {Link} from "@gourmet/react-i80";

export function LoginView() {
  return (
    <Link to="/?logged-in">
      Login
    </Link>
  );
}

export function LogoutView() {
  return (
    <div>
      You are logged out
      <div>
        <Link to="/?logged-in">
          Login again
        </Link>
      </div>
    </div>
  );
}

export function loginRequired({gmctx, url}) {
  if (url.search !== "?logged-in") {
    gmctx.redirect(i80.getUrl(LoginView));
    return true;
  }
}

export const routes = [
  ["/login", LoginView],
  ["/logout", LogoutView]
];
