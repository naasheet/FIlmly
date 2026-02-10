import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function updateListStats(listId: string) {
  const [filmCount, likeCount, followerCount] = await Promise.all([
    prisma.listFilm.count({ where: { listId } }),
    prisma.listLike.count({ where: { listId } }),
    prisma.listSave.count({ where: { listId } }),
  ])

  return prisma.list.update({
    where: { id: listId },
    data: {
      filmCount,
      likeCount,
      followerCount,
      lastActivityAt: new Date(),
    },
  })
}
