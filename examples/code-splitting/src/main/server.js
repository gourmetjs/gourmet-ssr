import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer/server";
import MainPage from "./MainPage";

__gourmet_module__.exports = emotionRenderer(gmctx => <MainPage gmctx={gmctx}/>);
