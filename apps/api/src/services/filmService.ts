import { PrismaClient } from "@prisma/client"
import {
  getFilmDetails as tmdbGetFilmDetails,
  getFilmCredits as tmdbGetFilmCredits,
  getFilmImages as tmdbGetFilmImages,
  searchFilms as tmdbSearchFilms,
} from "./tmdbService"
import { getOmdbPosterByImdbId, getOmdbPosterByTitle } from "./omdbService"

const prisma = new PrismaClient()
const STALE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

type FilmStats = {
  reviewCount: number
  averageRating: number | null
}

const IMAGES_STALE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function isStale(lastSyncedAt: Date | null) {
  if (!lastSyncedAt) {
    return true
  }
  return Date.now() - lastSyncedAt.getTime() > STALE_WINDOW_MS
}

function extractDirector(credits: { crew?: { job?: string; name?: string }[] } | undefined) {
  const crew = credits?.crew ?? []
  const director = crew.find((member) => member.job?.toLowerCase() === "director")
  return director?.name ?? null
}

function extractCast(credits: { cast?: { name?: string }[] } | undefined) {
  return (credits?.cast ?? [])
    .map((member) => member.name)
    .filter((name): name is string => Boolean(name))
}

function mapCredits(
  credits:
    | {
      cast?: { id: number; name: string; character?: string; profile_path?: string | null }[]
      crew?: { id: number; name: string; job?: string; department?: string; profile_path?: string | null }[]
    }
    | undefined,
) {
  return {
    cast: (credits?.cast ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character ?? null,
      profile_path: member.profile_path ?? null,
    })),
    crew: (credits?.crew ?? []).map((member) => ({
      id: member.id,
      name: member.name,
      job: member.job ?? null,
      department: member.department ?? null,
      profile_path: member.profile_path ?? null,
    })),
  }
}

function isImagesStale(lastSyncedAt: Date | null) {
  if (!lastSyncedAt) {
    return true
  }
  return Date.now() - lastSyncedAt.getTime() > IMAGES_STALE_WINDOW_MS
}

function getReleaseYear(releaseDate?: string | null) {
  if (!releaseDate) return undefined
  const parsed = new Date(releaseDate)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getFullYear()
}

async function resolvePosterPath(
  filmDetails: Awaited<ReturnType<typeof tmdbGetFilmDetails>>,
) {
  if (filmDetails.poster_path) {
    return filmDetails.poster_path
  }

  const imdbId = filmDetails.imdb_id ?? undefined
  const year = getReleaseYear(filmDetails.release_date ?? null)

  try {
    if (imdbId) {
      const poster = await getOmdbPosterByImdbId(imdbId)
      if (poster) return poster
    }
  } catch {
    // Fallback should not break film details
  }

  try {
    const poster = await getOmdbPosterByTitle(filmDetails.title, year)
    if (poster) return poster
  } catch {
    // Fallback should not break film details
  }

  return null
}

export async function syncFilmImages(filmId: number) {
  const images = await tmdbGetFilmImages(filmId)

  const backdrops = (images.backdrops ?? [])
    .slice()
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 10)
    .map((image) => image.file_path)
    .filter((path): path is string => Boolean(path))

  const logos = (images.logos ?? [])
    .slice()
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    .slice(0, 5)
    .map((image) => image.file_path)
    .filter((path): path is string => Boolean(path))

  const imagesSyncedAt = new Date()

  const updated = await prisma.film.update({
    where: { id: filmId },
    data: {
      backdrops,
      logos,
      imagesSyncedAt,
    },
  })

  return {
    film: updated,
    backdrops,
    logos,
    imagesSyncedAt,
  }
}

async function getFilmStats(filmId: number): Promise<FilmStats> {
  const aggregate = await prisma.review.aggregate({
    where: { filmId },
    _count: { _all: true },
    _avg: { rating: true },
  })

  return {
    reviewCount: aggregate._count._all,
    averageRating: aggregate._avg.rating ?? null,
  }
}

async function cacheFilm(filmDetails: Awaited<ReturnType<typeof tmdbGetFilmDetails>>) {
  const genres = (filmDetails.genres ?? []).map((genre) => genre.name)
  const director = extractDirector(filmDetails.credits)
  const cast = extractCast(filmDetails.credits)
  const posterPath = await resolvePosterPath(filmDetails)

  await prisma.film.upsert({
    where: { id: filmDetails.id },
    update: {
      title: filmDetails.title,
      originalTitle: filmDetails.original_title ?? null,
      overview: filmDetails.overview ?? null,
      posterPath,
      backdropPath: filmDetails.backdrop_path ?? null,
      releaseDate: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
      runtime: filmDetails.runtime ?? null,
      genres,
      director,
      cast,
      tmdbRating: filmDetails.vote_average ?? null,
      imdbId: filmDetails.imdb_id ?? null,
      lastSyncedAt: new Date(),
    },
    create: {
      id: filmDetails.id,
      title: filmDetails.title,
      originalTitle: filmDetails.original_title ?? null,
      overview: filmDetails.overview ?? null,
      posterPath,
      backdropPath: filmDetails.backdrop_path ?? null,
      releaseDate: filmDetails.release_date ? new Date(filmDetails.release_date) : null,
      runtime: filmDetails.runtime ?? null,
      genres,
      director,
      cast,
      tmdbRating: filmDetails.vote_average ?? null,
      imdbId: filmDetails.imdb_id ?? null,
      backdrops: [],
      logos: [],
      imagesSyncedAt: null,
      lastSyncedAt: new Date(),
    },
  })

  try {
    await syncFilmImages(filmDetails.id)
  } catch {
    // Image sync failures should not block core film data.
  }

  if (filmDetails.credits) {
    try {
      await syncFilmCredits(filmDetails.id, filmDetails.credits)
    } catch {
      // Credit sync failures should not block core film data.
    }
  }

  return prisma.film.findUniqueOrThrow({ where: { id: filmDetails.id } })
}

async function syncFilmCredits(
  filmId: number,
  credits: {
    cast?: { id: number; name: string; character?: string | null; order?: number }[]
    crew?: { id: number; name: string; job?: string | null; department?: string | null }[]
  }
) {
  const cast = credits.cast ?? []
  const crew = credits.crew ?? []

  await prisma.person.createMany({
    data: [
      ...cast.map((member) => ({
        id: member.id,
        name: member.name,
      })),
      ...crew.map((member) => ({
        id: member.id,
        name: member.name,
      })),
    ],
    skipDuplicates: true,
  })

  const creditRows = [
    ...cast.map((member) => ({
      filmId,
      personId: member.id,
      creditType: "cast",
      department: "Acting",
      job: null,
      character: member.character ?? null,
      order: member.order ?? null,
    })),
    ...crew.map((member) => ({
      filmId,
      personId: member.id,
      creditType: "crew",
      department: member.department ?? null,
      job: member.job ?? null,
      character: null,
      order: null,
    })),
  ]

  await prisma.filmCredit.createMany({
    data: creditRows,
    skipDuplicates: true,
  })
}

export async function searchFilms(query: string, year?: number, page = 1) {
  const tmdbResults = await tmdbSearchFilms(query, year, page)
  const ids = tmdbResults.results.map((result) => result.id)
  const cached = await prisma.film.findMany({
    where: { id: { in: ids } },
  })
  const cachedById = new Map(cached.map((film) => [film.id, film]))

  // Return fast search results: use cached films when present, otherwise minimal TMDB summary.
  const films = tmdbResults.results.map((result) => {
    const cachedFilm = cachedById.get(result.id)
    if (cachedFilm && !isStale(cachedFilm.lastSyncedAt)) {
      return { film: cachedFilm, stats: null }
    }
    return {
      film: {
        id: result.id,
        title: result.title,
        originalTitle: result.original_title ?? null,
        overview: result.overview ?? null,
        posterPath: result.poster_path ?? null,
        backdropPath: result.backdrop_path ?? null,
        releaseDate: result.release_date ? new Date(result.release_date) : null,
        runtime: null,
        genres: [],
        director: null,
        cast: [],
        tmdbRating: result.vote_average ?? null,
        imdbId: null,
        imdbRating: null,
        lastSyncedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      stats: null,
    }
  })

  // Background cache hydration for top few results (non-blocking).
  const hydrateIds = tmdbResults.results.slice(0, 3).map((result) => result.id)
  void Promise.allSettled(
    hydrateIds.map(async (id) => {
      const cachedFilm = cachedById.get(id)
      if (cachedFilm && !isStale(cachedFilm.lastSyncedAt)) return
      const details = await tmdbGetFilmDetails(id)
      await cacheFilm(details)
    }),
  )

  return {
    page: tmdbResults.page,
    total_pages: tmdbResults.total_pages,
    total_results: tmdbResults.total_results,
    results: films,
  }
}

export async function getFilmDetails(filmId: number) {
  const cachedFilm = await prisma.film.findUnique({ where: { id: filmId } })
  if (cachedFilm && !isStale(cachedFilm.lastSyncedAt)) {
    const credits = await tmdbGetFilmCredits(filmId).catch(() => null)
    if (isImagesStale(cachedFilm.imagesSyncedAt)) {
      void syncFilmImages(filmId).catch(() => null)
    }
    const stats = await getFilmStats(cachedFilm.id)
    return { film: cachedFilm, stats, credits: credits ? mapCredits(credits) : null }
  }

  const details = await tmdbGetFilmDetails(filmId)
  const film = await cacheFilm(details)
  const stats = await getFilmStats(film.id)
  return { film, stats, credits: mapCredits(details.credits) }
}

export { cacheFilm, getFilmStats }
