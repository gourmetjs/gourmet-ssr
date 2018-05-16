import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer/server";
import AdminPage from "./AdminPage";

__gourmet_module__.exports = emotionRenderer(gmctx => <AdminPage gmctx={gmctx}/>);
