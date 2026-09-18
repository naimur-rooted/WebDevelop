import jwt from "jsonwebtoken";

export function auth(required = true) {
  return (req, res, next) => {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      if (!required) return next();
      return res.status(401).json({ error: "Unauthorized" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Server misconfigured: JWT_SECRET is missing" });
    }
    try {
      req.user = jwt.verify(token, secret);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}
