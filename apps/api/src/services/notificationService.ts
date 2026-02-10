import { NotificationType, Prisma, PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type NotificationMetadata = Record<string, unknown>

type CreateNotificationInput = {
  recipientId: string
  actorId?: string | null
  type: NotificationType
  listId?: string | null
  reviewId?: string | null
  metadata?: NotificationMetadata | null
}

type RemoveNotificationInput = {
  recipientId: string
  actorId?: string | null
  type: NotificationType
  listId?: string | null
  reviewId?: string | null
}

type NotificationListOptions = {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
}

function asMetadata(value: Prisma.JsonValue | null): NotificationMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as NotificationMetadata
  }
  return {}
}

function getActorLabel(actor: { name?: string | null; username?: string | null } | null) {
  return actor?.name || actor?.username || "Someone"
}

function buildNotificationTitle(params: {
  type: NotificationType
  actorLabel: string
}) {
  switch (params.type) {
    case NotificationType.FOLLOWED_YOU:
      return `${params.actorLabel} followed you`
    case NotificationType.REVIEW_LIKED:
      return `${params.actorLabel} liked your review`
    case NotificationType.REVIEW_COMMENTED:
      return `${params.actorLabel} commented on your review`
    case NotificationType.LIST_LIKED:
      return `${params.actorLabel} liked your list`
    case NotificationType.LIST_SAVED:
      return `${params.actorLabel} saved your list`
    case NotificationType.LIST_INVITE:
      return `${params.actorLabel} invited you to collaborate`
    case NotificationType.LIST_INVITE_ACCEPTED:
      return `${params.actorLabel} accepted your collaborator invite`
    case NotificationType.LIST_COLLABORATOR_REMOVED:
      return `${params.actorLabel} removed you from a list`
    default:
      return "New activity"
  }
}

function buildNotificationBody(params: {
  type: NotificationType
  listTitle?: string | null
  filmTitle?: string | null
}) {
  if (params.type === NotificationType.REVIEW_LIKED || params.type === NotificationType.REVIEW_COMMENTED) {
    return params.filmTitle ? `On ${params.filmTitle}` : "On your review"
  }

  if (
    params.type === NotificationType.LIST_LIKED ||
    params.type === NotificationType.LIST_SAVED ||
    params.type === NotificationType.LIST_INVITE ||
    params.type === NotificationType.LIST_INVITE_ACCEPTED ||
    params.type === NotificationType.LIST_COLLABORATOR_REMOVED
  ) {
    return params.listTitle ?? "List activity"
  }

  return ""
}

function buildNotificationHref(params: {
  type: NotificationType
  actorUsername?: string | null
  listSlug?: string | null
  listId?: string | null
  filmId?: number | null
}) {
  switch (params.type) {
    case NotificationType.FOLLOWED_YOU:
      return params.actorUsername ? `/users/${params.actorUsername}` : null
    case NotificationType.REVIEW_LIKED:
    case NotificationType.REVIEW_COMMENTED:
      return params.filmId ? `/films/${params.filmId}` : "/reviews"
    case NotificationType.LIST_LIKED:
    case NotificationType.LIST_SAVED:
    case NotificationType.LIST_INVITE:
    case NotificationType.LIST_INVITE_ACCEPTED:
    case NotificationType.LIST_COLLABORATOR_REMOVED:
      if (params.listSlug) return `/lists/${params.listSlug}`
      if (params.listId) return `/lists/${params.listId}`
      return "/lists"
    default:
      return null
  }
}

class NotificationService {
  async create(input: CreateNotificationInput) {
    if (input.actorId && input.actorId === input.recipientId) {
      return null
    }

    return prisma.notification.create({
      data: {
        recipientId: input.recipientId,
        actorId: input.actorId ?? null,
        type: input.type,
        listId: input.listId ?? null,
        reviewId: input.reviewId ?? null,
        metadata:
          input.metadata === undefined
            ? undefined
            : (input.metadata as Prisma.InputJsonObject | null),
      },
    })
  }

  async remove(input: RemoveNotificationInput) {
    return prisma.notification.deleteMany({
      where: {
        recipientId: input.recipientId,
        actorId: input.actorId ?? null,
        type: input.type,
        listId: input.listId ?? null,
        reviewId: input.reviewId ?? null,
      },
    })
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    })
  }

  async listForUser(userId: string, options: NotificationListOptions = {}) {
    const page = Math.max(1, options.page ?? 1)
    const pageSize = Math.min(30, Math.max(1, options.pageSize ?? 12))
    const unreadOnly = Boolean(options.unreadOnly)

    const where: Prisma.NotificationWhereInput = {
      recipientId: userId,
      ...(unreadOnly ? { readAt: null } : {}),
    }

    const [total, unreadCount, items] = await Promise.all([
      prisma.notification.count({ where }),
      this.getUnreadCount(userId),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          actor: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          list: {
            select: {
              id: true,
              slug: true,
              title: true,
            },
          },
          review: {
            select: {
              id: true,
              filmId: true,
              film: {
                select: {
                  id: true,
                  title: true,
                  posterPath: true,
                },
              },
            },
          },
        },
      }),
    ])

    return {
      page,
      pageSize,
      total,
      unreadCount,
      notifications: items.map((item) => {
        const metadata = asMetadata(item.metadata)
        const actorLabel = getActorLabel(item.actor)
        const contributorId =
          typeof metadata.contributorId === "string" ? metadata.contributorId : null

        return {
          id: item.id,
          type: item.type,
          createdAt: item.createdAt,
          readAt: item.readAt,
          isRead: Boolean(item.readAt),
          title: buildNotificationTitle({
            type: item.type,
            actorLabel,
          }),
          body: buildNotificationBody({
            type: item.type,
            listTitle: item.list?.title,
            filmTitle: item.review?.film?.title,
          }),
          href: buildNotificationHref({
            type: item.type,
            actorUsername: item.actor?.username,
            listSlug: item.list?.slug,
            listId: item.listId,
            filmId: item.review?.filmId,
          }),
          actor: item.actor,
          list: item.list,
          review: item.review
            ? {
                id: item.review.id,
                filmId: item.review.filmId,
                film: item.review.film,
              }
            : null,
          metadata,
          action:
            item.type === NotificationType.LIST_INVITE && contributorId
              ? {
                  type: "accept_invite",
                  contributorId,
                }
              : null,
        }
      }),
    }
  }

  async markAsRead(userId: string, notificationId: string) {
    const now = new Date()
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: now,
      },
    })
    return { success: true }
  }

  async markAllAsRead(userId: string) {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    })
    return { success: true, updated: result.count }
  }
}

export const notificationService = new NotificationService()
