import { env } from "../config/env"

const OMDB_BASE_URL = "https://www.omdbapi.com/"

type OmdbResponse = {
  Response: "True" | "False"
  Poster?: string
  Error?: string
}

function buildUrl(params: Record<string, string | number | undefined>) {
  const apiKey = env.OMDB_API_KEY
  if (!apiKey) {
    return null
  }

  const url = new URL(OMDB_BASE_URL)
  const searchParams = new URLSearchParams({ apikey: apiKey })

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value))
    }
  })

  url.search = searchParams.toString()
  return url
}

async function omdbGet(params: Record<string, string | number | undefined>) {
  const url = buildUrl(params)
  if (!url) {
    return null
  }

  const response = await fetch(url.toString())
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`OMDb request failed (${response.status}): ${body || response.statusText}`)
  }

  return (await response.json()) as OmdbResponse
}

function normalizePoster(poster: string | undefined) {
  if (!poster || poster === "N/A") {
    return null
  }
  return poster
}

export async function getOmdbPosterByImdbId(imdbId: string) {
  const data = await omdbGet({ i: imdbId })
  if (!data || data.Response === "False") {
    return null
  }
  return normalizePoster(data.Poster)
}

export async function getOmdbPosterByTitle(title: string, year?: number) {
  const data = await omdbGet({ t: title, y: year })
  if (!data || data.Response === "False") {
    return null
  }
  return normalizePoster(data.Poster)
}
