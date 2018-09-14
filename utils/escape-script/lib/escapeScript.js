"use strict";

module.exports = function escapeScript(content, isInline=false) {
  if (isInline)
    return content.replace("&", "\\u0026").replace("\"", "\\u0022");
  else
    return content.replace("</script>", "\\u003c/script>");
};
