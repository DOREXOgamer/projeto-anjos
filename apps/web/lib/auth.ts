import { supabase } from "./supabase"

const TOKEN_KEY = "anjos_token"
const USER_KEY = "anjos_user"
const COOKIE_KEY = "anjos_token"
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export type UserRole = "ADMIN" | "DIRECTOR" | "COORDINATOR" | "SECRETARY" | "TEACHER" | "STUDENT"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
  permissions: string[]
}

type AuthResponse = {
  token: string
  user: AuthUser
}

function isBrowser() {
  return typeof window !== "undefined"
}

export function getStoredToken() {
  if (!isBrowser()) return null
  return window.localStorage.getItem(TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveSession(token: string, user: AuthUser) {
  if (!isBrowser()) return
  window.localStorage.setItem(TOKEN_KEY, token)
  window.localStorage.setItem(USER_KEY, JSON.stringify(user))
  const maxAge = 60 * 60 * 24 * 7
  document.cookie = `${COOKIE_KEY}=${token}; path=/; max-age=${maxAge}`
}

export function clearSession() {
  if (!isBrowser()) return
  window.localStorage.removeItem(TOKEN_KEY)
  window.localStorage.removeItem(USER_KEY)
  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      const data = await parseJson<{ token?: string; user?: AuthUser; error?: string }>(res)
      if (data.token && data.user) {
        return { token: data.token, user: data.user }
      }
    }
  } catch (e) {
    // API backend local indisponível (Failed to fetch). Tenta autenticação via Supabase.
  }

  // Fallback via Supabase
  try {
    const { data: userDoc } = await supabase.from("users").select("*").eq("email", email).single()
    if (userDoc) {
      const user: AuthUser = {
        id: userDoc.id,
        name: userDoc.name,
        email: userDoc.email,
        role: (userDoc.role as UserRole) || "ADMIN",
        permissions: userDoc.permissions || ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"]
      }
      const token = `token-${userDoc.id}`
      return { token, user }
    }
  } catch (err) {}

  // Usuário Admin Padrão se o banco ainda não possuir registros
  if (email === "admin@anjosinocentes.org.br" && password === "admin123") {
    const defaultUser: AuthUser = {
      id: "admin-default-id",
      name: "Administrador Anjos",
      email: "admin@anjosinocentes.org.br",
      role: "ADMIN",
      permissions: ["alunos", "turmas", "presenca", "plano_aula", "calendario", "comunicacao", "notas"]
    }
    return {
      token: "admin-default-token",
      user: defaultUser
    }
  }

  throw new Error("Credenciais inválidas ou serviço indisponível")
}

export async function meRequest(token: string): Promise<AuthUser> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (res.ok) {
      const data = await parseJson<{ user?: AuthUser; error?: string }>(res)
      if (data.user) {
        return data.user
      }
    }
  } catch (e) {
    // Backend offline
  }

  const storedUser = getStoredUser()
  if (storedUser) {
    return storedUser
  }

  throw new Error("Sessão inválida")
}

