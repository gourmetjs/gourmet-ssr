"use strict";

module.exports = function getServer(BaseClass) {
  return class Server extends BaseClass {
    installMiddleware() {
      this.app.get("/admin", (req, res, next) => {
        this.gourmet.render(req, res, next, {entrypoint: "admin"});
      });
      super.installMiddleware();
    }
  };
};
