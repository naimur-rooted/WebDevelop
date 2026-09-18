import app from "../backend/server.js";

export default (req, res) => {
  // Vercel may strip the "/api" mount prefix or keep it — support both.
  // Express app defines routes as "/api/...", so re-add it if missing.
  if (req.url && !req.url.startsWith("/api/") && req.url !== "/api") {
    req.url = req.url === "/" ? "/api/health" : `/api${req.url.startsWith("/") ? req.url : `/${req.url}`}`;
  }
  return app(req, res);
};
