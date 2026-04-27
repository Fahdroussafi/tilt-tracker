// ─────────────────────────────────────────────────────────────
//  Auth types — mirrors backend DTOs & response interfaces
// ─────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  username?: string
}

export interface UserProfile {
  id: string
  email: string
  username: string | null
  createdAt: string
}

export interface AuthMessage {
  message: string
}
