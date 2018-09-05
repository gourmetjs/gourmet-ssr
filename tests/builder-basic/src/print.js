export default function print(text) {
  const output = document.getElementById("client_output");
  output.innerHTML += text + "<br>";
}
