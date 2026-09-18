import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Plain Vite SPA build -> frontend/dist. Served as a Render Static Site with a
// catch-all rewrite to index.html; all API calls go cross-origin to the
// backend Web Service via VITE_API_URL (see src/lib/api.ts).
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});


