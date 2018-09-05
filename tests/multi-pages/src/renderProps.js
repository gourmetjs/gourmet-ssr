export default function renderProps(props) {
  return Object.keys(props).sort().map(name => {
    let value = props[name];
    if (name === "gmctx")
      value = "{...}";
    else
      value = JSON.stringify(value);
    return `  ${name}: ${value}\n`;
  });
}
