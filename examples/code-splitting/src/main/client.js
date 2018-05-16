import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer";
import MainPage from "./MainPage";

emotionRenderer(gmctx => <MainPage gmctx={gmctx}/>).render();
