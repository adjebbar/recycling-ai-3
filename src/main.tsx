import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./i18n"; // import i18n configuration

createRoot(document.getElementById("root")!).render(
  <React.Suspense fallback="Loading...">
    <App />
  </React.Suspense>,
);