import { PrismaClient, ActivityType, ContributorRole, ContributorStatus, NotificationType } from "@prisma/client"
import { isListOwner } from "../utils/listPermissions"
import { notificationService } from "./notificationService"

const prisma = new PrismaClient()

class ListCollaborationService {
  private async syncCollaboratorCount(listId: string) {
    const count = await prisma.listContributor.count({
      where: {
        listId,
        status: ContributorStatus.ACCEPTED,
        role: { not: ContributorRole.OWNER },
      },
    })

    await prisma.list.update({
      where: { id: listId },
      data: { collaboratorCount: count, lastActivityAt: new Date() },
    })
  }

  async inviteContributor(
    listId: string,
    userId: string,
    role: ContributorRole,
    invitedBy: string
  ) {
    const owner = await isListOwner(listId, invitedBy)
    if (!owner) {
      throw new Error("Only owner can invite contributors")
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { listType: true },
    })
    if (!list) {
      throw new Error("List not found")
    }
    if (list.listType !== "COLLABORATIVE") {
      throw new Error("Only collaborative lists can have contributors")
    }

    if (role !== ContributorRole.EDITOR) {
      throw new Error("Only editor role is supported")
    }

    const existing = await prisma.listContributor.findUnique({
      where: { listId_userId: { listId, userId } },
      select: { id: true },
    })
    if (existing) {
      throw new Error("User already a contributor")
    }

    const invitation = await prisma.$transaction(async (tx) => {
      const contributor = await tx.listContributor.create({
        data: {
          listId,
          userId,
          role,
          status: ContributorStatus.PENDING,
          invitedBy,
        },
        include: {
          user: {
            select: { id: true, username: true, name: true, avatarUrl: true },
          },
        },
      })

      await tx.listActivity.create({
        data: {
          listId,
          userId: invitedBy,
          activityType: ActivityType.CONTRIBUTOR_ADDED,
          metadata: { invitedUserId: userId, role },
        },
      })

      return contributor
    })

    await notificationService.create({
      recipientId: userId,
      actorId: invitedBy,
      type: NotificationType.LIST_INVITE,
      listId,
      metadata: {
        contributorId: invitation.id,
        role,
      },
    })

    return invitation
  }

  async acceptInvitation(contributorId: string, userId: string) {
    const contributor = await prisma.listContributor.findUnique({
      where: { id: contributorId },
      select: {
        id: true,
        listId: true,
        invitedBy: true,
        userId: true,
      },
    })
    if (!contributor) {
      throw new Error("Invitation not found")
    }
    if (contributor.userId !== userId) {
      throw new Error("Unauthorized")
    }

    const updated = await prisma.listContributor.update({
      where: { id: contributorId },
      data: { status: ContributorStatus.ACCEPTED, role: ContributorRole.EDITOR },
    })
    const list = await prisma.list.findUnique({
      where: { id: updated.listId },
      select: { userId: true },
    })
    const recipientIds = new Set<string>()
    if (contributor.invitedBy) recipientIds.add(contributor.invitedBy)
    if (list?.userId) recipientIds.add(list.userId)
    recipientIds.delete(userId)

    await Promise.all(
      Array.from(recipientIds).map((recipientId) =>
        notificationService.create({
          recipientId,
          actorId: userId,
          type: NotificationType.LIST_INVITE_ACCEPTED,
          listId: updated.listId,
          metadata: {
            contributorId: updated.id,
          },
        })
      )
    )

    await this.syncCollaboratorCount(updated.listId)
    return updated
  }

  async removeContributor(listId: string, contributorId: string, removedBy: string) {
    const owner = await isListOwner(listId, removedBy)
    if (!owner) {
      throw new Error("Only owner can remove contributors")
    }

    const target = await prisma.listContributor.findUnique({
      where: { id: contributorId },
      select: { role: true, userId: true },
    })
    if (!target) {
      throw new Error("Contributor not found")
    }
    if (target.role === ContributorRole.OWNER) {
      throw new Error("Cannot remove owner")
    }

    await prisma.$transaction(async (tx) => {
      await tx.listContributor.delete({ where: { id: contributorId } })
      await tx.listActivity.create({
        data: {
          listId,
          userId: removedBy,
          activityType: ActivityType.CONTRIBUTOR_REMOVED,
          metadata: { removedUserId: target.userId },
        },
      })
    })

    await notificationService.create({
      recipientId: target.userId,
      actorId: removedBy,
      type: NotificationType.LIST_COLLABORATOR_REMOVED,
      listId,
      metadata: {
        contributorId,
      },
    })

    await this.syncCollaboratorCount(listId)

    return { success: true }
  }

  async transferOwnership(listId: string, newOwnerUserId: string, currentOwnerUserId: string) {
    const owner = await isListOwner(listId, currentOwnerUserId)
    if (!owner) {
      throw new Error("Only owner can transfer ownership")
    }

    const newOwner = await prisma.listContributor.findUnique({
      where: { listId_userId: { listId, userId: newOwnerUserId } },
      select: { id: true },
    })

    if (!newOwner) {
      throw new Error("New owner must be a contributor")
    }

    await prisma.$transaction(async (tx) => {
      await tx.listContributor.updateMany({
        where: { listId, userId: currentOwnerUserId },
        data: { role: ContributorRole.EDITOR },
      })
      await tx.listContributor.updateMany({
        where: { listId, userId: newOwnerUserId },
        data: { role: ContributorRole.OWNER, status: ContributorStatus.ACCEPTED },
      })
    })
    await this.syncCollaboratorCount(listId)

    return { success: true }
  }
}

export const listCollaborationService = new ListCollaborationService()
