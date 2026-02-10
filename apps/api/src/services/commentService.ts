import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type AddCommentInput = {
  activityId: string
  userId: string
  content: string
  parentId?: string | null
}

export async function addComment(data: AddCommentInput) {
  return prisma.comment.create({
    data: {
      activityId: data.activityId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId ?? null,
    },
    include: {
      user: true,
      replies: { include: { user: true } },
    },
  })
}

export async function getComments(activityId: string) {
  const comments = await prisma.comment.findMany({
    where: { activityId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      user: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: { user: true },
      },
    },
  })

  return comments
}

export async function deleteComment(commentId: string, userId: string) {
  const existing = await prisma.comment.findUnique({ where: { id: commentId } })
  if (!existing) {
    throw new Error("Comment not found")
  }
  if (existing.userId !== userId) {
    throw new Error("Not authorized to delete this comment")
  }

  await prisma.comment.delete({ where: { id: commentId } })
  return { success: true }
}
