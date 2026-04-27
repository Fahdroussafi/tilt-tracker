import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "~/lib/api"
import type {
  AuthMessage,
  LoginPayload,
  RegisterPayload,
  UserProfile,
} from "~/lib/auth"

// ── Query Keys ──────────────────────────────────────────────
export const authKeys = {
  me: ["auth", "me"] as const,
}

// ── GET /auth/me ────────────────────────────────────────────
export function useMe() {
  return useQuery<UserProfile>({
    queryKey: authKeys.me,
    queryFn: async () => {
      const { data } = await api.get<UserProfile>("/auth/me")
      return data
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

// ── POST /auth/login ────────────────────────────────────────
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation<AuthMessage, Error, LoginPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<AuthMessage>("/auth/login", payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}

// ── POST /auth/register ─────────────────────────────────────
export function useRegister() {
  return useMutation<UserProfile, Error, RegisterPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<UserProfile>("/auth/register", payload)
      return data
    },
  })
}

// ── POST /auth/logout ───────────────────────────────────────
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation<AuthMessage, Error, void>({
    mutationFn: async () => {
      const { data } = await api.post<AuthMessage>("/auth/logout")
      return data
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.me, null)
      queryClient.invalidateQueries({ queryKey: authKeys.me })
    },
  })
}
