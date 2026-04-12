import type { NextFunction, Request, Response } from "express"
import type { Role } from "@prisma/client"
import type { AuthTokenPayload } from "../lib/jwt"
import { verifyToken } from "../lib/jwt"

export interface AuthRequest extends Request {
  user?: AuthTokenPayload
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const token = header.slice("Bearer ".length)
  try {
    const payload = verifyToken(token)
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ error: "Invalid token" })
  }
}

export function requireRole(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" })
    }

    return next()
  }
}
