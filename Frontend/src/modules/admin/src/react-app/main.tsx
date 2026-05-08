import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@admin/react-app/index.css";
import App from "@admin/react-app/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

