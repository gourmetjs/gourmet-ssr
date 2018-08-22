import loadable from "@gourmet/react-loadable";

export default loadable({
  loader: () => import(/* webpackChunkName: "photo" */ "./PhotoPanel")
});
