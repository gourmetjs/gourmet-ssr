import concat from "./concat";

export default function renderer({entrypoint, manifest}) {
  const staticPrefix = manifest.staticPrefix;
  const scripts = manifest.client.entrypoints[entrypoint].map(filename => {
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
