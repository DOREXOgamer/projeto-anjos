"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { AuthUser } from "@/lib/auth"
import { clearSession, getStoredToken, getStoredUser, loginRequest, meRequest, saveSession } from "@/lib/auth"

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getStoredToken()
    const cachedUser = getStoredUser()

    if (!token) {
      setLoading(false)
      return
    }

    if (cachedUser) {
      setUser(cachedUser)
    }

    meRequest(token)
      .then((freshUser) => {
        saveSession(token, freshUser)
        setUser(freshUser)
      })
      .catch(() => {
        clearSession()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedUser } = await loginRequest(email, password)
    saveSession(token, loggedUser)
    setUser(loggedUser)
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
