import type { Request, Response } from "express"
import { param, query, validationResult } from "express-validator"
import { ListPrivacy, PrismaClient } from "@prisma/client"
import { getFilmDetails, searchFilms, syncFilmImages } from "../services/filmService"
import { getFilmReviews } from "../services/reviewService"
import { getPopularFilms, getTrendingFilms, getSimilarFilms } from "../services/tmdbService"
import { getOscarsByFilmId } from "../services/oscarsService"

type Handler = (req: Request, res: Response) => Promise<Response>

const prisma = new PrismaClient()
const IMAGE_STALE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const TRENDING_CACHE_TTL_MS = 5 * 60 * 1000
const trendingCache = new Map<
  string,
  { expiresAt: number; data: Awaited<ReturnType<typeof getTrendingFilms>> }
>()
const popularCache = new Map<
  string,
  { expiresAt: number; data: Awaited<ReturnType<typeof getPopularFilms>> }
>()

function handleValidation(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

export const searchValidation = [
  query("query").isString().trim().isLength({ min: 1 }),
  query("year").optional().isInt({ min: 1878, max: 2100 }).toInt(),
  query("page").optional().isInt({ min: 1, max: 1000 }).toInt(),
]

export const getDetailsValidation = [param("id").isInt({ min: 1 }).toInt()]

export const getPopularValidation = [query("page").optional().isInt({ min: 1, max: 1000 }).toInt()]
export const getTrendingValidation = [
  query("timeWindow").optional().isIn(["day", "week"]),
  query("page").optional().isInt({ min: 1, max: 1000 }).toInt(),
]
export const getSimilarValidation = [
  param("id").isInt({ min: 1 }).toInt(),
  query("page").optional().isInt({ min: 1, max: 1000 }).toInt(),
]
export const getOscarsValidation = [param("id").isInt({ min: 1 }).toInt()]
export const getListsValidation = [param("id").isInt({ min: 1 }).toInt()]

export const getForFilmValidation = [
  param("id").isInt({ min: 1 }).toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("sortBy")
    .optional()
    .isIn(["newest", "oldest", "highest_rating", "lowest_rating", "most_liked"]),
]

export const searchHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const queryText = String(req.query.query)
    const year = req.query.year ? Number(req.query.year) : undefined
    const page = req.query.page ? Number(req.query.page) : 1
    const result = await searchFilms(queryText, year, page)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Search failed" })
  }
}

export const getDetailsHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.id)
    const result = await getFilmDetails(filmId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch film details" })
  }
}

export const getPopularHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const page = req.query.page ? Number(req.query.page) : 1
    const cacheKey = `popular:${page}`
    const cached = popularCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json(cached.data)
    }
    const result = await getPopularFilms(page)
    popularCache.set(cacheKey, { data: result, expiresAt: Date.now() + TRENDING_CACHE_TTL_MS })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch popular films" })
  }
}

export const getTrendingHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const timeWindow = (req.query.timeWindow as "day" | "week" | undefined) ?? "day"
    const page = req.query.page ? Number(req.query.page) : 1
    const cacheKey = `${timeWindow}:${page}`
    const cached = trendingCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return res.status(200).json(cached.data)
    }
    const result = await getTrendingFilms(timeWindow, page)
    trendingCache.set(cacheKey, { data: result, expiresAt: Date.now() + TRENDING_CACHE_TTL_MS })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch trending films" })
  }
}

export const getSimilarHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.id)
    const page = req.query.page ? Number(req.query.page) : 1
    const result = await getSimilarFilms(filmId, page)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch similar films" })
  }
}

export const getOscarsHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.id)
    const oscars = getOscarsByFilmId(filmId)
    return res.status(200).json({ oscars })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch Oscar data" })
  }
}

export const getImagesHandler: Handler = async (req, res) => {
  try {
    const filmId = Number(req.params.id)
    if (!filmId || Number.isNaN(filmId)) {
      return res.status(400).json({ message: "Invalid film id" })
    }

    const film = await prisma.film.findUnique({
      where: { id: filmId },
      select: {
        backdrops: true,
        logos: true,
        imagesSyncedAt: true,
      },
    })

    if (!film) {
      return res.status(404).json({ message: "Film not found" })
    }

    const hasImages = (film.backdrops?.length ?? 0) > 0 || (film.logos?.length ?? 0) > 0
    const isStale =
      !film.imagesSyncedAt ||
      Date.now() - film.imagesSyncedAt.getTime() > IMAGE_STALE_WINDOW_MS

    if (!hasImages || isStale) {
      const synced = await syncFilmImages(filmId)
      return res.status(200).json({
        backdrops: synced.backdrops,
        logos: synced.logos,
        imagesSyncedAt: synced.imagesSyncedAt,
      })
    }

    return res.status(200).json({
      backdrops: film.backdrops ?? [],
      logos: film.logos ?? [],
      imagesSyncedAt: film.imagesSyncedAt,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch film images" })
  }
}

export const getForFilmHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.id)
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const sortBy = req.query.sortBy
      ? (String(req.query.sortBy) as Parameters<typeof getFilmReviews>[1]["sortBy"])
      : undefined
    const result = await getFilmReviews(filmId, { page, pageSize, sortBy })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch reviews" })
  }
}

export const getListsForFilmHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.id)
    const where = {
      filmId,
      list: {
        is: {
          privacy: { in: [ListPrivacy.PUBLIC, ListPrivacy.UNLISTED] },
        },
      },
    }

    const [total, listFilms] = await Promise.all([
      prisma.listFilm.count({ where }),
      prisma.listFilm.findMany({
        where,
        take: 10,
        orderBy: { list: { likeCount: "desc" } },
        include: {
          list: {
            include: {
              user: { select: { id: true, username: true, name: true, avatarUrl: true } },
            },
          },
        },
      }),
    ])

    return res.status(200).json({
      total,
      lists: listFilms.map((item) => ({
        list: item.list,
        rank: item.rank,
      })),
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch lists" })
  }
}
