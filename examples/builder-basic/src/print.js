export default function print(...args) {
  const text = args.join(" ");

  if (SERVER) {
    console.log(text);
  } else {
    document.write(text + "<br>");
  }  
}
