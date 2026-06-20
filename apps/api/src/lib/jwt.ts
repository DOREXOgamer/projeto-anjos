import jwt from "jsonwebtoken"
import { env } from "./env.js"
import type { Role } from "./db.js"

export type AuthTokenPayload = {
  sub: string
  email: string
  role: Role
}

export function signToken(payload: AuthTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload
}
