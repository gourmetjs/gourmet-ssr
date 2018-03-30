import reactRenderer from "@gourmet/react-renderer/server";
import Hello from "./Hello";

__gourmet_module__.exports = reactRenderer(() => {
  if (STAGE !== "hot") {
    return <Hello/>;
  } else {
    return null;
  }
});
