"use strict";

const Server = require("./getServer")(require("@gourmet/server-impl-watch"));
new Server().start();
