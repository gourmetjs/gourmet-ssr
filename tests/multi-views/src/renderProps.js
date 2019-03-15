export default function renderProps(title, props) {
  const json = {};
  return [`** ${title} **\n`].concat(Object.keys(props).sort().map(name => {
    let value = props[name];
    if (name === "gmctx" || name === "route") {
      json[name] = value = "{...}";
    } else {
      json[name] = value;
      value = JSON.stringify(value);
    }
    return `  ${name}: ${value}\n`;
  }).concat([`  JSON(${title})_BEGIN_[${JSON.stringify(json)}]_END_JSON(${title})\n`]));
}
