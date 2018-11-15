"use strict";

class A {}

function fn() {
  const val = 10;
  return val;
}

module.exports = () => {
  const info = JSON.stringify({
    message: "Hello, world!",
    "class A": A.toString(),
    "fn": fn.toString()
  }, null, 2);

  if (CLIENT) {
    const parent = document.getElementById("client_output");
    parent.innerText = info;
  } else  {
    return `<pre id="server_output">${info}</pre><pre id="client_output"></pre>`;
  }
};
