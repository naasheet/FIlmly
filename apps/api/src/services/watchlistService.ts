import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type CreateWatchlistInput = {
  name: string
  description?: string | null
}

export async function getOrCreateDefaultWatchlist(userId: string) {
  const existing = await prisma.watchlist.findFirst({
    where: { userId, name: "My Watchlist" },
    include: { items: true },
  })
  if (existing) return existing

  return prisma.watchlist.create({
    data: {
      userId,
      name: "My Watchlist",
      description: "Your default watchlist",
    },
    include: { items: true },
  })
}

export async function listWatchlists(userId: string) {
  return prisma.watchlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { film: true },
      },
    },
  })
}

export async function createWatchlist(userId: string, data: CreateWatchlistInput) {
  return prisma.watchlist.create({
    data: {
      userId,
      name: data.name,
      description: data.description ?? null,
    },
  })
}

export async function getDefaultWatchlist(userId: string) {
  return prisma.watchlist.findFirst({
    where: { userId, name: "My Watchlist" },
    include: { items: { include: { film: true } } },
  }).then(async (existing) => {
    if (existing) return existing
    return prisma.watchlist.create({
      data: {
        userId,
        name: "My Watchlist",
        description: "Your default watchlist",
      },
      include: { items: { include: { film: true } } },
    })
  })
}

export async function addToDefaultWatchlist(userId: string, filmId: number) {
  const alreadyWatched = await prisma.watched.findUnique({
    where: {
      userId_filmId: {
        userId,
        filmId,
      },
    },
  })
  if (alreadyWatched) {
    throw new Error("Film already marked as watched")
  }

  const watchlist = await getOrCreateDefaultWatchlist(userId)
  const item = await prisma.watchlistItem.create({
    data: {
      watchlistId: watchlist.id,
      filmId,
    },
  })
  return { watchlistId: watchlist.id, item }
}

export async function removeFromDefaultWatchlist(userId: string, filmId: number) {
  const watchlist = await getOrCreateDefaultWatchlist(userId)
  await prisma.watchlistItem.delete({
    where: {
      watchlistId_filmId: {
        watchlistId: watchlist.id,
        filmId,
      },
    },
  })
  return { success: true }
}

export async function isInDefaultWatchlist(userId: string, filmId: number) {
  const watchlist = await getOrCreateDefaultWatchlist(userId)
  const item = await prisma.watchlistItem.findUnique({
    where: {
      watchlistId_filmId: {
        watchlistId: watchlist.id,
        filmId,
      },
    },
  })
  return { inWatchlist: Boolean(item), item }
}

export async function toggleDefaultWatchlist(userId: string, filmId: number) {
  const alreadyWatched = await prisma.watched.findUnique({
    where: {
      userId_filmId: {
        userId,
        filmId,
      },
    },
  })
  if (alreadyWatched) {
    throw new Error("Film already marked as watched")
  }

  const watchlist = await getOrCreateDefaultWatchlist(userId)
  const existing = await prisma.watchlistItem.findUnique({
    where: {
      watchlistId_filmId: {
        watchlistId: watchlist.id,
        filmId,
      },
    },
  })

  if (existing) {
    await prisma.watchlistItem.delete({ where: { id: existing.id } })
    return { inWatchlist: false }
  }

  const item = await prisma.watchlistItem.create({
    data: {
      watchlistId: watchlist.id,
      filmId,
    },
  })
  return { inWatchlist: true, item }
}
