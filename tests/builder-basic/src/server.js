import renderer from "./renderer";

__gourmet_module__.exports = ({page, manifest}) => {
  const render = renderer({page, manifest});
  return ({reqArgs, clientProps}) => {
    return render(
      "** SERVER **",
      `page: ${page}`,
      `stage: ${manifest.stage}`,
      `staticPrefix: ${manifest.staticPrefix}`,
      `reqArgs.url: ${reqArgs.url}`,
      `clientProps: ${JSON.stringify(clientProps)}`
    );
  };
};
