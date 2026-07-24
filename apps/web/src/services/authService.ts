import api, { normalizeApiError } from "./api"

type AuthUser = {
  id: string
  email: string
  username?: string | null
  supabaseUserId?: string | null
  name?: string | null
  avatarUrl?: string | null
}

type TokenPair = {
  accessToken: string
  refreshToken: string
}

export async function register(data: {
  email: string
  username: string
  password: string
  name?: string
}) {
  try {
    const res = await api.post<{ user: AuthUser; tokens: TokenPair }>(
      "/auth/register",
      data
    )
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function login(data: { identifier: string; password: string }) {
  try {
    const res = await api.post<{ user: AuthUser; tokens: TokenPair }>(
      "/auth/login",
      { identifier: data.identifier, password: data.password }
    )
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function refresh(refreshToken: string) {
  try {
    const res = await api.post<{ accessToken: string }>("/auth/refresh", {
      refreshToken,
    })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function logout(refreshToken: string) {
  try {
    const res = await api.post<{ success: boolean }>("/auth/logout", {
      refreshToken,
    })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function requestPasswordReset(identifier: string) {
  try {
    const res = await api.post<{ message: string }>("/auth/forgot-password", {
      identifier,
    })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function resetPassword(params: {
  identifier: string
  code: string
  newPassword: string
}) {
  try {
    const res = await api.post<{ success: boolean }>("/auth/reset-password", params)
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function socialLogin(accessToken: string, provider: string) {
  try {
    const res = await api.post<{ user: AuthUser; tokens: TokenPair }>(
      "/auth/social",
      { accessToken, provider }
    )
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export { supabase } from "../lib/supabase"

