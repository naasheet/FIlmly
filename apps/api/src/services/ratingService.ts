import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type AddRatingInput = {
  userId: string
  filmId: number
  rating: number
}

type UpdateRatingInput = {
  rating: number
}

async function createActivity({
  type,
  userId,
  filmId,
  metadata,
}: {
  type: string
  userId: string
  filmId?: number
  metadata?: Record<string, unknown>
}) {
  return prisma.activity.create({
    data: {
      type,
      userId,
      filmId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function addRating(data: AddRatingInput) {
  try {
    const rating = await prisma.rating.create({
      data: {
        userId: data.userId,
        filmId: data.filmId,
        rating: Number(data.rating),
      },
    })
    await createActivity({
      type: "rating_created",
      userId: data.userId,
      filmId: data.filmId,
    })
    return rating
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("Rating already exists for this film")
    }
    throw error
  }
}

export async function updateRating(id: string, userId: string, data: UpdateRatingInput) {
  const existing = await prisma.rating.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Rating not found")
  }
  if (existing.userId !== userId) {
    throw new Error("Not authorized to update this rating")
  }

  const rating = await prisma.rating.update({
    where: { id },
    data: { rating: Number(data.rating) },
  })
  await createActivity({
    type: "rating_updated",
    userId,
    filmId: rating.filmId,
  })
  return rating
}

export async function deleteRating(id: string, userId: string) {
  const existing = await prisma.rating.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Rating not found")
  }
  if (existing.userId !== userId) {
    throw new Error("Not authorized to delete this rating")
  }

  await prisma.rating.delete({ where: { id } })
  await createActivity({
    type: "rating_deleted",
    userId,
    filmId: existing.filmId,
  })
  return { success: true }
}

export async function getUserRatingForFilm(userId: string, filmId: number) {
  return prisma.rating.findUnique({
    where: {
      userId_filmId: {
        userId,
        filmId,
      },
    },
  })
}
