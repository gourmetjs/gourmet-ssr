import loadable from "@gourmet/react-loadable";

const HomeView = loadable({
  loader: () => import(/* webpackChunkName: "home" */ "./HomePanel")
});

HomeView.getInitialProps = async function(props) {};    // props
HomeView.routeName = "Home";
HomeView.autoPreload = false;   // Used by <Link/>

export default HomeView;
