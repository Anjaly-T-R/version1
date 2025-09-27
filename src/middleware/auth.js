export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function requireAdmin(req, res, next) {
  console.log("Decoded user object:", req.user);
  const groups = req.user?.groups || [];
  if (groups.includes("admin")) {
    return next();
  }
  return res.status(403).json({ error: "Admin only action" });
}

