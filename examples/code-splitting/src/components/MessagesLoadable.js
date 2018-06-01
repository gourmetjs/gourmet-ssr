import loadable from "@gourmet/react-loadable";
import Loading from "./Loading";

export default loadable({
  loader: () => import(/* webpackChunkName: "messages" */ "./MessagesPanel"),
  loading: Loading
});
