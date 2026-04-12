import { verifyToken } from "../lib/jwt";
export function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = verifyToken(token);
        req.user = payload;
        return next();
    }
    catch {
        return res.status(401).json({ error: "Invalid token" });
    }
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        return next();
    };
}
