import concat from "./concat";

export default function renderer({page, manifest}) {
  const staticPrefix = manifest.staticPrefix;
  const scripts = manifest.client.pages[page].map(filename => {
    return `<script defer src="${staticPrefix}${filename}"></script>`;
  }).join("\n");

  return (...lines) => {
    return {
      content: concat(
        scripts,
        `<pre id="server_output">${concat(...lines)}</pre>`,
        '<pre id="client_output"></pre>'
      )
    };
  };
}
