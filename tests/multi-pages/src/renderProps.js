export default function renderProps(props) {
  const json = {};
  return Object.keys(props).sort().map(name => {
    let value = props[name];
    if (name === "gmctx") {
      json[name] = value = "{...}";
    } else {
      json[name] = value;
      value = JSON.stringify(value);
    }
    return `  ${name}: ${value}\n`;
  }).concat([`  JSON: ${JSON.stringify(json)}\n`]);
}
