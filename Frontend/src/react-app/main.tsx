import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import UnifiedApp from "@/react-app/UnifiedApp";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UnifiedApp />
  </StrictMode>
);
