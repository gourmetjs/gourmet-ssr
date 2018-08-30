import loadable from "@gourmet/react-loadable";

export default loadable({
  loader() {
    return import("./PanelB");
  }
});
