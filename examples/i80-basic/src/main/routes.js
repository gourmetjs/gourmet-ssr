import {defineRoutes} from "@gourmet/react-i80";
import HomeView from "../components/HomeView";
import MessagesView from "../components/MessagesView";
import ProfileView from "../components/ProfileView";

defineRoutes({
  "/": HomeView,
  "/messages/:ncol": MessagesView,
  "/profile/:id": ProfileView
}, {
  basePath: "/",
  fallthrough: true,
  plainLinks: true
});
