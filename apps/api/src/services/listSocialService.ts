import { NotificationType, PrismaClient } from "@prisma/client"
import { updateListStats } from "../utils/listStats"
import { notificationService } from "./notificationService"

const prisma = new PrismaClient()

type Pagination = {
  page?: number
  pageSize?: number
}

class ListSocialService {
  async likeList(listId: string, userId: string) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { userId: true, likeCount: true },
    })
    if (!list) {
      throw new Error("List not found")
    }

    const existing = await prisma.listLike.findUnique({
      where: { listId_userId: { listId, userId } },
      select: { id: true },
    })

    if (existing) {
      return { likeCount: list.likeCount ?? 0 }
    }

    await prisma.listLike.create({
      data: {
        listId,
        userId,
      },
    })
    await notificationService.create({
      recipientId: list.userId,
      actorId: userId,
      type: NotificationType.LIST_LIKED,
      listId,
    })

    const updated = await updateListStats(listId)
    return { likeCount: updated.likeCount }
  }

  async unlikeList(listId: string, userId: string) {
    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { userId: true, likeCount: true },
    })
    if (!list) {
      throw new Error("List not found")
    }

    const deleted = await prisma.listLike.deleteMany({
      where: { listId, userId },
    })

    if (deleted.count === 0) {
      return { likeCount: list.likeCount ?? 0 }
    }
    await notificationService.remove({
      recipientId: list.userId,
      actorId: userId,
      type: NotificationType.LIST_LIKED,
      listId,
    })

    const updated = await updateListStats(listId)
    return { likeCount: updated.likeCount }
  }

  async getUsersWhoLiked(listId: string, pagination?: Pagination) {
    const page = Math.max(1, pagination?.page ?? 1)
    const pageSize = Math.min(20, Math.max(1, pagination?.pageSize ?? 20))

    const likes = await prisma.listLike.findMany({
      where: { listId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    return likes.map((like) => like.user)
  }
}

export const listSocialService = new ListSocialService()
