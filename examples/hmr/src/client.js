import React from "react";
import emotionRenderer from "@gourmet/emotion-renderer";
import MainApp from "./MainApp";

emotionRenderer(() => <MainApp greeting="Hello, world"/>).render();
