import { env } from "../config/env"
import type {
  TMDBMovieDetails,
  TMDBCredits,
  TMDBMovieSummary,
  TMDBPersonDetails,
  TMDBPersonExternalIds,
  TMDBPersonMovieCredits,
  TMDBPersonImages,
  TMDBPersonSummary,
  TMDBImages,
  TMDBPaginatedResponse,
  TMDBTimeWindow,
} from "../types/tmdb"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"
const TMDB_CACHE_TTL_MS = 2 * 60 * 60 * 1000
const TMDB_CACHE_TTL_LONG_MS = 14 * 24 * 60 * 60 * 1000
const TMDB_CACHE_TTL_PERSON_MS = 14 * 24 * 60 * 60 * 1000
const TMDB_CACHE_TTL_TRENDING_MS = 8 * 60 * 60 * 1000
const TMDB_CACHE_MAX = 500
const TMDB_RATE_LIMIT = 40
const TMDB_RATE_WINDOW_MS = 10_000

const tmdbCache = new Map<string, { expiresAt: number; data: unknown }>()
const tmdbRequestTimestamps: number[] = []

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function acquireTmdbSlot() {
  while (true) {
    const now = Date.now()
    while (tmdbRequestTimestamps.length > 0 && now - tmdbRequestTimestamps[0] > TMDB_RATE_WINDOW_MS) {
      tmdbRequestTimestamps.shift()
    }

    if (tmdbRequestTimestamps.length < TMDB_RATE_LIMIT) {
      tmdbRequestTimestamps.push(now)
      return
    }

    const waitTime = TMDB_RATE_WINDOW_MS - (now - tmdbRequestTimestamps[0])
    await sleep(Math.max(waitTime, 250))
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(`${TMDB_BASE_URL}${path}`)
  const searchParams = new URLSearchParams({
    api_key: env.TMDB_API_KEY,
  })

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.set(key, String(value))
      }
    })
  }

  url.search = searchParams.toString()
  return url
}

async function tmdbGet<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  ttlMs: number = TMDB_CACHE_TTL_MS,
) {
  const url = buildUrl(path, params)
  const cacheKey = url.toString()
  const cached = tmdbCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T
  }
  await acquireTmdbSlot()

  let attempt = 0
  let response: Response | null = null
  while (attempt < 4) {
    try {
      response = await fetch(url.toString())
      if (response.status !== 429) {
        break
      }
    } catch {
      // handled by retry below
    }
    const backoffMs = Math.min(4000, 500 * Math.pow(2, attempt))
    await sleep(backoffMs)
    attempt += 1
  }

  if (!response) {
    throw new Error("TMDB request failed: no response")
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`TMDB request failed (${response.status}): ${body || response.statusText}`)
  }

  const data = (await response.json()) as T
  tmdbCache.set(cacheKey, { expiresAt: Date.now() + ttlMs, data })
  if (tmdbCache.size > TMDB_CACHE_MAX) {
    const firstKey = tmdbCache.keys().next().value
    if (firstKey) {
      tmdbCache.delete(firstKey)
    }
  }
  return data
}

export async function searchFilms(
  query: string,
  year?: number,
  page = 1,
): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> {
  return tmdbGet("/search/movie", { query, year, page }, TMDB_CACHE_TTL_MS)
}

export async function searchPeople(
  query: string,
  page = 1,
): Promise<TMDBPaginatedResponse<TMDBPersonSummary>> {
  return tmdbGet("/search/person", { query, page, include_adult: "false" }, TMDB_CACHE_TTL_MS)
}

export async function getFilmDetails(filmId: number | string): Promise<TMDBMovieDetails> {
  return tmdbGet(`/movie/${filmId}`, { append_to_response: "credits,videos,images" }, TMDB_CACHE_TTL_LONG_MS)
}

export async function getFilmCredits(filmId: number | string): Promise<TMDBCredits> {
  return tmdbGet(`/movie/${filmId}/credits`, undefined, TMDB_CACHE_TTL_LONG_MS)
}

export async function getFilmImages(filmId: number | string): Promise<TMDBImages> {
  try {
    return await tmdbGet(
      `/movie/${filmId}/images`,
      { include_image_language: "en,null" },
      TMDB_CACHE_TTL_LONG_MS,
    )
  } catch (error: any) {
    const message = error?.message ?? "TMDB images request failed"
    throw new Error(message)
  }
}

export async function getPersonDetails(personId: number): Promise<TMDBPersonDetails> {
  try {
    return await tmdbGet(`/person/${personId}`, undefined, TMDB_CACHE_TTL_PERSON_MS)
  } catch (error: any) {
    const message = error?.message ?? "TMDB person details request failed"
    throw new Error(message)
  }
}

export async function getPersonExternalIds(
  personId: number,
): Promise<TMDBPersonExternalIds> {
  try {
    return await tmdbGet(`/person/${personId}/external_ids`, undefined, TMDB_CACHE_TTL_PERSON_MS)
  } catch (error: any) {
    const message = error?.message ?? "TMDB person external ids request failed"
    throw new Error(message)
  }
}

export async function getPersonCredits(personId: number): Promise<TMDBPersonMovieCredits> {
  try {
    return await tmdbGet(`/person/${personId}/movie_credits`, undefined, TMDB_CACHE_TTL_LONG_MS)
  } catch (error: any) {
    const message = error?.message ?? "TMDB person credits request failed"
    throw new Error(message)
  }
}

export async function getPersonImages(personId: number): Promise<TMDBPersonImages> {
  try {
    return await tmdbGet(`/person/${personId}/images`, undefined, TMDB_CACHE_TTL_LONG_MS)
  } catch (error: any) {
    const message = error?.message ?? "TMDB person images request failed"
    throw new Error(message)
  }
}
export async function getPopularFilms(page = 1): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> {
  return tmdbGet("/movie/popular", { page }, TMDB_CACHE_TTL_TRENDING_MS)
}

export async function getTrendingFilms(
  timeWindow: TMDBTimeWindow = "day",
  page = 1,
): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> {
  return tmdbGet(`/trending/movie/${timeWindow}`, { page }, TMDB_CACHE_TTL_TRENDING_MS)
}

export async function getSimilarFilms(
  filmId: number | string,
  page = 1,
): Promise<TMDBPaginatedResponse<TMDBMovieSummary>> {
  return tmdbGet(`/movie/${filmId}/similar`, { page }, TMDB_CACHE_TTL_LONG_MS)
}

export function getImageUrl(path: string | null | undefined, size = "w500") {
  if (!path) {
    return null
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${TMDB_IMAGE_BASE_URL}/${size}${normalizedPath}`
}
