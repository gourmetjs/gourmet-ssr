import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer";
import AdminPage from "./AdminPage";

emotionRenderer(gmctx => <AdminPage gmctx={gmctx}/>).render();
