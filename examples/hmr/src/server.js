import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer/server";
import MainApp from "./MainApp";

__gourmet_module__.exports = emotionRenderer(() => <MainApp greeting="Hello, world"/>);
