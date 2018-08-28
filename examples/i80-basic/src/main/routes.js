import HomeView from "../components/HomeView";
import MessagesView from "../components/MessagesView";
import ProfileView from "../components/ProfileView";
import adminRoutes from "./adminRoutes";

const routes = [
  ["/", HomeView],    // Route middlewares
  ["/messages/:ncol", MessagesView],
  ["/profile/:id", ProfileView],
  ["/admin", adminRoutes]
];

export default routes;
