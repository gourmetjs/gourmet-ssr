export default function renderProps(title, props) {
  return [`** ${title} **\n`].concat(Object.keys(props).sort().map(name => {
    let value = props[name];
    if (name === "gmctx" || name === "activeRoute")
      value = "{...}";
    else
      value = JSON.stringify(value);
    return `  ${name}: ${value}\n`;
  }));
}
