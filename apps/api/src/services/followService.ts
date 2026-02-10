import { NotificationType, PrismaClient } from "@prisma/client"
import { notificationService } from "./notificationService"

const prisma = new PrismaClient()

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("You cannot follow yourself")
  }

  try {
    const follow = await prisma.follow.create({
      data: { followerId, followingId },
    })
    await notificationService.create({
      recipientId: followingId,
      actorId: followerId,
      type: NotificationType.FOLLOWED_YOU,
    })
    return { following: true, follow }
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { following: true }
    }
    throw error
  }
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new Error("You cannot unfollow yourself")
  }

  const deleted = await prisma.follow.deleteMany({
    where: { followerId, followingId },
  })

  if (deleted.count > 0) {
    await notificationService.remove({
      recipientId: followingId,
      actorId: followerId,
      type: NotificationType.FOLLOWED_YOU,
    })
  }

  return { following: false }
}

export async function getFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: { follower: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getFollowing(userId: string) {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: { following: true },
    orderBy: { createdAt: "desc" },
  })
}

export async function getMutualFollows(userId: string) {
  const [following, followers] = await Promise.all([
    prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true },
    }),
  ])

  const followingSet = new Set(following.map((item) => item.followingId))
  const mutual = followers
    .map((item) => item.followerId)
    .filter((id) => followingSet.has(id))

  return { mutual }
}
