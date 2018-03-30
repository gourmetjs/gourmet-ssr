import reactRenderer from "@gourmet/react-renderer/server";
import renderApp from "./renderApp";

__gourmet_module__.exports = reactRenderer(() => {
  if (STAGE !== "hot") {
    return renderApp();
  } else {
    return null;
  }
});
