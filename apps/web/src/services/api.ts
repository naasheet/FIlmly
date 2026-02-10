import axios, { AxiosError, type AxiosInstance } from "axios"
import { useAuthStore } from "../stores/authStore"

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000"

const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api/v1`,
  timeout: 15000,
})

const refreshClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  timeout: 15000,
})

let refreshPromise: Promise<string> | null = null

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()
  if (accessToken) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const { response, config } = error
    const status = response?.status
    const originalRequest = config as typeof config & { _retry?: boolean }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const { refreshToken } = useAuthStore.getState()
      if (!refreshToken) {
        const path = window.location.pathname
        const search = window.location.search
        if (path !== "/login" && path !== "/signup") {
          const next = encodeURIComponent(`${path}${search}`)
          window.location.href = `/login?next=${next}`
        }
        return Promise.reject(error)
      }

      originalRequest._retry = true

      if (!refreshPromise) {
        refreshPromise = refreshClient
          .post("/auth/refresh", { refreshToken })
          .then((res) => {
            const accessToken = res.data?.accessToken as string | undefined
            if (!accessToken) {
              throw new Error("Missing access token")
            }
            useAuthStore.setState({ accessToken, refreshToken })
            return accessToken
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      try {
        const newAccessToken = await refreshPromise
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().clearAuth()
        const path = window.location.pathname
        const search = window.location.search
        if (path !== "/login" && path !== "/signup") {
          const next = encodeURIComponent(`${path}${search}`)
          window.location.href = `/login?next=${next}`
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export function normalizeApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message
    return message
  }
  return error instanceof Error ? error.message : "Something went wrong"
}

export default api
