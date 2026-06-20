import type { AuthUser } from "@/lib/auth"

export const PERMISSIONS = {
  ALUNOS: "alunos",
  TURMAS: "turmas",
  PRESENCA: "presenca",
  PLANO_AULA: "plano_aula",
  CALENDARIO: "calendario",
  COMUNICACAO: "comunicacao",
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

export function hasPermission(user: AuthUser | null, permission: Permission) {
  if (!user) return false
  if (user.role === "DIRECTOR") return true
  return user.permissions?.includes(permission)
}
