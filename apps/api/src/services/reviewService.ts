import { NotificationType, Prisma, PrismaClient } from "@prisma/client"
import { notificationService } from "./notificationService"

const prisma = new PrismaClient()

type CreateReviewInput = {
  userId: string
  filmId: number
  title: string
  rating: number
  comment?: string | null
  containsSpoilers?: boolean
  rewatch?: boolean
  watchedDate?: string | Date | null
}

type UpdateReviewInput = {
  title?: string | null
  rating?: number
  comment?: string | null
  containsSpoilers?: boolean
  rewatch?: boolean
  watchedDate?: string | Date | null
}

type SortBy = "newest" | "oldest" | "highest_rating" | "lowest_rating" | "most_liked"

type ReviewListOptions = {
  page?: number
  pageSize?: number
  sortBy?: SortBy
}

function buildOrderBy(sortBy: SortBy) {
  switch (sortBy) {
    case "oldest":
      return [{ createdAt: "asc" }] as Prisma.ReviewOrderByWithRelationInput[]
    case "highest_rating":
      return [{ rating: "desc" }, { createdAt: "desc" }] as Prisma.ReviewOrderByWithRelationInput[]
    case "lowest_rating":
      return [{ rating: "asc" }, { createdAt: "desc" }] as Prisma.ReviewOrderByWithRelationInput[]
    case "most_liked":
      return [{ likes: { _count: "desc" } }, { createdAt: "desc" }] as Prisma.ReviewOrderByWithRelationInput[]
    case "newest":
    default:
      return [{ createdAt: "desc" }] as Prisma.ReviewOrderByWithRelationInput[]
  }
}

async function createReviewVersion(
  reviewId: string,
  title: string | null,
  rating: number,
  comment?: string | null,
  containsSpoilers?: boolean,
  rewatch?: boolean,
  watchedDate?: string | Date | null
) {
  return prisma.reviewVersion.create({
    data: {
      reviewId,
      title,
      rating,
      comment: comment ?? null,
      containsSpoilers: Boolean(containsSpoilers),
      rewatch: Boolean(rewatch),
      watchedDate: watchedDate ? new Date(watchedDate) : null,
    },
  })
}

export async function createReview(data: CreateReviewInput) {
  let review
  try {
    review = await prisma.review.create({
      data: {
        userId: data.userId,
        filmId: data.filmId,
        title: data.title,
        rating: data.rating,
        comment: data.comment ?? null,
        containsSpoilers: Boolean(data.containsSpoilers),
        rewatch: Boolean(data.rewatch),
        watchedDate: data.watchedDate ? new Date(data.watchedDate) : null,
      },
    })
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("You already reviewed this film")
    }
    throw error
  }

  await createReviewVersion(
    review.id,
    review.title,
    review.rating,
    review.comment,
    review.containsSpoilers,
    review.rewatch,
    review.watchedDate
  )
  return prisma.review.findUnique({
    where: { id: review.id },
    include: { versions: { orderBy: { createdAt: "desc" } }, likes: true },
  })
}

export async function updateReview(id: string, userId: string, data: UpdateReviewInput) {
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Review not found")
  }
  if (existing.userId !== userId) {
    throw new Error("Not authorized to update this review")
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      title: data.title ?? existing.title,
      rating: data.rating ?? existing.rating,
      comment: data.comment ?? existing.comment,
      containsSpoilers: data.containsSpoilers ?? existing.containsSpoilers,
      rewatch: data.rewatch ?? existing.rewatch,
      watchedDate:
        data.watchedDate !== undefined
          ? data.watchedDate
            ? new Date(data.watchedDate)
            : null
          : existing.watchedDate,
    },
  })

  await createReviewVersion(
    updated.id,
    updated.title,
    updated.rating,
    updated.comment,
    updated.containsSpoilers,
    updated.rewatch,
    updated.watchedDate
  )
  return prisma.review.findUnique({
    where: { id: updated.id },
    include: { versions: { orderBy: { createdAt: "desc" } }, likes: true },
  })
}

export async function deleteReview(id: string, userId: string) {
  const existing = await prisma.review.findUnique({ where: { id } })
  if (!existing) {
    throw new Error("Review not found")
  }
  if (existing.userId !== userId) {
    throw new Error("Not authorized to delete this review")
  }

  await prisma.review.delete({ where: { id } })
  return { success: true }
}

export async function getReview(id: string) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      versions: { orderBy: { createdAt: "desc" } },
      likes: true,
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      user: true,
    },
  })
  if (!review) {
    throw new Error("Review not found")
  }

  return review
}

export async function getFilmReviews(filmId: number, options: ReviewListOptions = {}) {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10))
  const sortBy = options.sortBy ?? "newest"

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { filmId } }),
    prisma.review.findMany({
      where: { filmId },
      orderBy: buildOrderBy(sortBy),
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        versions: { orderBy: { createdAt: "desc" } },
        likes: true,
        user: true,
        _count: { select: { comments: true, likes: true } },
      },
    }),
  ])

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    sortBy,
    results: reviews,
  }
}

export async function addReviewComment(reviewId: string, userId: string, content: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })
  if (!review) {
    throw new Error("Review not found")
  }

  const comment = await prisma.reviewComment.create({
    data: {
      reviewId,
      userId,
      content,
    },
  })

  await notificationService.create({
    recipientId: review.userId,
    actorId: userId,
    type: NotificationType.REVIEW_COMMENTED,
    reviewId: review.id,
    metadata: { commentId: comment.id },
  })

  return comment
}

export async function listReviewComments(reviewId: string) {
  return prisma.reviewComment.findMany({
    where: { reviewId },
    orderBy: { createdAt: "desc" },
    include: { user: true },
  })
}

export async function getUserReviews(userId: string) {
  return prisma.review.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      film: true,
      _count: { select: { comments: true, likes: true } },
    },
  })
}

export async function reportReview(
  reviewId: string,
  reporterId: string,
  reason: string,
  details?: string | null,
) {
  try {
    return await prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason,
        details: details ?? null,
      },
    })
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("You already reported this review")
    }
    throw error
  }
}

export async function toggleLike(reviewId: string, userId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, userId: true },
  })
  if (!review) {
    throw new Error("Review not found")
  }

  const existing = await prisma.reviewLike.findUnique({
    where: {
      reviewId_userId: {
        reviewId,
        userId,
      },
    },
  })

  if (existing) {
    await prisma.reviewLike.delete({ where: { id: existing.id } })
    await notificationService.remove({
      recipientId: review.userId,
      actorId: userId,
      type: NotificationType.REVIEW_LIKED,
      reviewId,
    })
    return { liked: false }
  }

  await prisma.reviewLike.create({
    data: {
      reviewId,
      userId,
    },
  })
  await notificationService.create({
    recipientId: review.userId,
    actorId: userId,
    type: NotificationType.REVIEW_LIKED,
    reviewId: review.id,
  })
  return { liked: true }
}
