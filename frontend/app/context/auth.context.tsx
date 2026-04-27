// ─────────────────────────────────────────────────────────────
//  Auth Context
//  Credentials-based auth using JWT httpOnly cookies.
//  Hydrates current user via GET /auth/me on app load.
//  Exposes `isAuthenticated`, `user`, `isLoading`, and mutations.
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, type ReactNode } from "react"
import { useMe } from "~/hooks/use-auth"
import type { UserProfile } from "~/lib/auth"

// ── Types ────────────────────────────────────────────────────

interface AuthContextValue {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data: user, isLoading, isError } = useMe()

  const value: AuthContextValue = {
    isAuthenticated: !!user && !isError,
    user: user ?? null,
    isLoading,
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return ctx
}
