import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { getRouter } from "./router";

// SPA entry point. The browser router mounts into #root from index.html;
// the root route (src/routes/__root.tsx) provides the QueryClient context.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={getRouter()} />
  </StrictMode>,
);
