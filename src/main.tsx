import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App, { createAppRouter } from "./App";
import "./styles.css";
const router = createAppRouter();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App router={router} />
  </StrictMode>,
);
