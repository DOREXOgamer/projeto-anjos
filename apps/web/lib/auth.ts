const TOKEN_KEY = "anjos_token"
const USER_KEY = "anjos_user"
const COOKIE_KEY = "anjos_token"
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export type UserRole = "DIRECTOR" | "TEACHER"

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
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  const data = await parseJson<{ token?: string; user?: AuthUser; error?: string }>(res)

  if (!res.ok || !data.token || !data.user) {
    throw new Error(data.error || "Credenciais inválidas")
  }

  return {
    token: data.token,
    user: data.user,
  }
}

export async function meRequest(token: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await parseJson<{ user?: AuthUser; error?: string }>(res)

  if (!res.ok || !data.user) {
    throw new Error(data.error || "Sessão inválida")
  }

  return data.user
}
