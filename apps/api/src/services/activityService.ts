import { Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type ActivityInput = {
  type: string
  userId: string
  filmId?: number
  reviewId?: string
  metadata?: Record<string, unknown>
}

type FeedOptions = {
  page?: number
  pageSize?: number
}

function normalizePage(options: FeedOptions = {}) {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20))
  return { page, pageSize }
}

export async function createActivity(data: ActivityInput) {
  return prisma.activity.create({
    data: {
      type: data.type,
      userId: data.userId,
      filmId: data.filmId,
      reviewId: data.reviewId,
      metadata: data.metadata as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function getActivityFeed(
  userId: string,
  options: FeedOptions = {},
  type?: string
) {
  const { page, pageSize } = normalizePage(options)

  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })

  const feedUserIds = [userId, ...following.map((item) => item.followingId)]

  const where = {
    userId: { in: feedUserIds },
    ...(type ? { type } : {}),
  }

  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: true,
        review: true,
        film: true,
      },
    }),
  ])

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    results: activities,
  }
}

export async function getGlobalFeed(options: FeedOptions = {}) {
  const { page, pageSize } = normalizePage(options)

  const [total, activities] = await Promise.all([
    prisma.activity.count(),
    prisma.activity.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: true,
        review: true,
        film: true,
      },
    }),
  ])

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    results: activities,
  }
}
