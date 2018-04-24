import renderer from "./renderer";

__gourmet_module__.exports = ({entrypoint, manifest}) => {
  const render = renderer({entrypoint, manifest});
  return ({path, query, params}) => {
    return render(
      "** SERVER **",
      `entrypoint: ${entrypoint}`,
      `stage: ${manifest.stage}`,
      `staticPrefix: ${manifest.staticPrefix}`,
      `path: ${path}`,
      `query: ${JSON.stringify(query)}`,
      `params: ${JSON.stringify(params)}`
    );
  };
};
