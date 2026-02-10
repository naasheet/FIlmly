import api, { normalizeApiError } from "./api"
import { refresh } from "./authService"
import { useAuthStore } from "../stores/authStore"

export async function searchFilms(params: { query: string; year?: number; page?: number }) {
  try {
    const res = await api.get("/films/search", { params })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function getFilmDetails(id: number) {
  try {
    const res = await api.get(`/films/${id}`)
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function getPopularFilms(page = 1) {
  try {
    const res = await api.get("/films/popular", { params: { page } })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function getFilmLists(filmId: number) {
  try {
    const res = await api.get(`/films/${filmId}/lists`)
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function getTrendingFilms(
  timeWindow: "day" | "week" = "day",
  page = 1
) {
  try {
    const res = await api.get("/films/trending", { params: { timeWindow, page } })
    return res.data
  } catch (error) {
    throw new Error(normalizeApiError(error))
  }
}

export async function getWatchedStatus(filmId: number) {
  return getWatchedStatusBatched(filmId)
}

export async function toggleWatched(filmId: number) {
  try {
    const res = await api.post(`/users/me/watched/${filmId}`)
    return res.data as { watched: boolean; watchedAt: string | null }
  } catch (error) {
    const message = normalizeApiError(error)
    if (message.includes("Unauthorized")) {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        const data = await refresh(refreshToken)
        useAuthStore.setState({ accessToken: data.accessToken, refreshToken })
        const retry = await api.post(`/users/me/watched/${filmId}`)
        return retry.data as { watched: boolean; watchedAt: string | null }
      }
    }
    throw new Error(message)
  }
}

type WatchedStatus = { watched: boolean; watchedAt: string | null }

const watchedCache = new Map<number, { data: WatchedStatus; expiresAt: number }>()
const watchedPending = new Map<number, Array<(value: WatchedStatus) => void>>()
const watchedErrors = new Map<number, Array<(error: Error) => void>>()
let watchedBatchTimer: number | null = null
const watchedBatchIds = new Set<number>()
const WATCHED_CACHE_TTL_MS = 2 * 60 * 1000

function queueWatchedBatch() {
  if (watchedBatchTimer !== null) return
  watchedBatchTimer = window.setTimeout(async () => {
    const ids = Array.from(watchedBatchIds)
    watchedBatchIds.clear()
    watchedBatchTimer = null
    if (ids.length === 0) return

    try {
      const response = await fetchWatchedStatuses(ids)
      const found = new Map<number, WatchedStatus>()
      response.forEach((status) => {
        found.set(status.filmId, { watched: status.watched, watchedAt: status.watchedAt })
      })

      ids.forEach((id) => {
        const data = found.get(id) ?? { watched: false, watchedAt: null }
        watchedCache.set(id, { data, expiresAt: Date.now() + WATCHED_CACHE_TTL_MS })
        const resolvers = watchedPending.get(id) ?? []
        resolvers.forEach((resolve) => resolve(data))
        watchedPending.delete(id)
        watchedErrors.delete(id)
      })
    } catch (error: any) {
      ids.forEach((id) => {
        const rejecters = watchedErrors.get(id) ?? []
        rejecters.forEach((reject) => reject(error))
        watchedErrors.delete(id)
        watchedPending.delete(id)
      })
    }
  }, 50)
}

async function fetchWatchedStatuses(filmIds: number[]) {
  try {
    const res = await api.post(`/users/me/watched/statuses`, { filmIds })
    return (res.data?.statuses ?? []) as Array<{ filmId: number; watched: boolean; watchedAt: string | null }>
  } catch (error) {
    const message = normalizeApiError(error)
    if (message.includes("Unauthorized")) {
      const { refreshToken } = useAuthStore.getState()
      if (refreshToken) {
        const data = await refresh(refreshToken)
        useAuthStore.setState({ accessToken: data.accessToken, refreshToken })
        const retry = await api.post(`/users/me/watched/statuses`, { filmIds })
        return (retry.data?.statuses ?? []) as Array<{ filmId: number; watched: boolean; watchedAt: string | null }>
      }
    }
    throw new Error(message)
  }
}

function getWatchedStatusBatched(filmId: number) {
  const cached = watchedCache.get(filmId)
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.data)
  }

  return new Promise<WatchedStatus>((resolve, reject) => {
    const existingResolvers = watchedPending.get(filmId) ?? []
    watchedPending.set(filmId, [...existingResolvers, resolve])
    const existingRejects = watchedErrors.get(filmId) ?? []
    watchedErrors.set(filmId, [...existingRejects, reject])
    watchedBatchIds.add(filmId)
    queueWatchedBatch()
  })
}
