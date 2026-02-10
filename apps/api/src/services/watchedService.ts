import { PrismaClient } from "@prisma/client"
import { getOrCreateDefaultWatchlist } from "./watchlistService"
import { cacheFilm } from "./filmService"
import { getFilmDetails as tmdbGetFilmDetails } from "./tmdbService"

const prisma = new PrismaClient()

export async function getWatchedStatus(userId: string, filmId: number) {
  const existing = await prisma.watched.findUnique({
    where: {
      userId_filmId: {
        userId,
        filmId,
      },
    },
  })
  return { watched: Boolean(existing), watchedAt: existing?.watchedAt ?? null }
}

export async function toggleWatched(userId: string, filmId: number) {
  const existingFilm = await prisma.film.findUnique({ where: { id: filmId } })
  if (!existingFilm) {
    const details = await tmdbGetFilmDetails(filmId)
    await cacheFilm(details)
  }

  const existing = await prisma.watched.findUnique({
    where: {
      userId_filmId: {
        userId,
        filmId,
      },
    },
  })

  if (existing) {
    await prisma.watched.delete({ where: { id: existing.id } })
    return { watched: false, watchedAt: null }
  }

  const created = await prisma.watched.create({
    data: {
      userId,
      filmId,
    },
  })

  const watchlist = await getOrCreateDefaultWatchlist(userId)
  await prisma.watchlistItem.deleteMany({
    where: {
      watchlistId: watchlist.id,
      filmId,
    },
  })

  return { watched: true, watchedAt: created.watchedAt }
}

export async function getWatchedByUser(userId: string) {
  return prisma.watched.findMany({
    where: { userId },
    orderBy: { watchedAt: "desc" },
    include: { film: true },
  })
}

export async function getWatchedStatuses(userId: string, filmIds: number[]) {
  if (filmIds.length === 0) {
    return []
  }

  const records = await prisma.watched.findMany({
    where: {
      userId,
      filmId: { in: filmIds },
    },
    select: {
      filmId: true,
      watchedAt: true,
    },
  })

  return records.map((record) => ({
    filmId: record.filmId,
    watched: true,
    watchedAt: record.watchedAt,
  }))
}
