"use strict";

function _serializeValue(value, objs) {
  if (value && typeof value === "object") {
    if (Array.isArray(value))
      value = _serializeArray(value, objs);
    else
      value = _serializeObject(value, objs);
  } else if (typeof value === "function") {
    value = "...";
  }
  return value;
}

function _serializeArray(arr, objs) {
  if (objs.indexOf(arr) !== -1)
    return "...";

  objs.push(arr);

  return arr.map(value => {
    return _serializeValue(value, objs);
  });
}

// Serializes an error into a plain object.
function _serializeObject(obj, objs) {
  if (objs.indexOf(obj) !== -1)
    return "...";

  objs.push(obj);

  const stockProps = ["name", "message", "stack"];
  const props = Object.keys(obj);
  const res = {};

  stockProps.concat(props).forEach((prop, idx) => {
    if (idx >= stockProps.length && stockProps.indexOf(prop) !== -1)
      return;

    const value = _serializeValue(obj[prop], objs);

    if (value !== undefined)
      res[prop] = value;
  });

  return res;
}

module.exports = function serializeError(err) {
  return err instanceof Error ? _serializeObject(err, []) : (err || {});
};
