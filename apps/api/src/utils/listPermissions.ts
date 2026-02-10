import {
  PrismaClient,
  ContributorRole,
  ContributorStatus,
  ListPrivacy,
} from "@prisma/client"

const prisma = new PrismaClient()

export async function canUserViewList(listId: string, userId?: string | null) {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { privacy: true },
  })

  if (!list) return false

  if (list.privacy === ListPrivacy.PUBLIC || list.privacy === ListPrivacy.UNLISTED) {
    return true
  }

  if (!userId) return false

  const contributor = await prisma.listContributor.findUnique({
    where: {
      listId_userId: {
        listId,
        userId,
      },
    },
    select: { role: true, status: true },
  })

  return (
    contributor?.role === ContributorRole.OWNER ||
    contributor?.status === ContributorStatus.ACCEPTED
  )
}

export async function canUserEditList(listId: string, userId?: string | null) {
  if (!userId) return false

  const contributor = await prisma.listContributor.findUnique({
    where: {
      listId_userId: {
        listId,
        userId,
      },
    },
    select: { role: true, status: true },
  })

  if (!contributor) return false
  if (contributor.role === ContributorRole.OWNER) return true
  if (contributor.status !== ContributorStatus.ACCEPTED) return false

  return (
    contributor.role === ContributorRole.EDITOR ||
    contributor.role === ContributorRole.CONTRIBUTOR
  )
}

export async function isListOwner(listId: string, userId?: string | null) {
  if (!userId) return false

  const contributor = await prisma.listContributor.findUnique({
    where: {
      listId_userId: {
        listId,
        userId,
      },
    },
    select: { role: true },
  })

  return contributor?.role === ContributorRole.OWNER
}
