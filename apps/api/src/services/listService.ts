import {
  PrismaClient,
  ActivityType,
  ContributorRole,
  ContributorStatus,
  ListPrivacy,
  ListType,
} from "@prisma/client"
import crypto from "node:crypto"
import { env } from "../config/env"
import { canUserEditList, canUserViewList, isListOwner } from "../utils/listPermissions"
import { updateListStats } from "../utils/listStats"

const prisma = new PrismaClient()

type UploadFileInput = {
  buffer: Buffer
  mimetype: string
  originalName?: string
}

function getCloudinaryConfig() {
  const cloudName = env.CLOUDINARY_CLOUD_NAME
  const apiKey = env.CLOUDINARY_API_KEY
  const apiSecret = env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary configuration missing")
  }

  return { cloudName, apiKey, apiSecret }
}

async function uploadToCloudinary(file: UploadFileInput, publicId: string) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = "list-covers"
  const overwrite = "true"

  const signatureBase =
    `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex")

  const form = new FormData()
  form.append(
    "file",
    new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
    file.originalName || "cover.jpg"
  )
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))
  form.append("public_id", publicId)
  form.append("folder", folder)
  form.append("overwrite", overwrite)
  form.append("signature", signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: form as any,
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Cloudinary upload failed (${response.status}): ${body}`)
  }

  return JSON.parse(body) as { secure_url?: string }
}

type CreateListInput = {
  title: string
  description?: string | null
  userId: string
  listType: ListType
  privacy: ListPrivacy
  isRanked?: boolean
  tags?: string[]
}

type UpdateListInput = {
  title?: string
  description?: string | null
  privacy?: ListPrivacy
  listType?: ListType
  isRanked?: boolean
  tags?: string[]
  coverImagePath?: string | null
  pinned?: boolean
}

type BulkAddResult = {
  added: string[]
  skipped: string[]
  unauthorized: string[]
}

function slugifyTitle(title: string) {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
  return slug || "list"
}

async function generateUniqueSlug(title: string) {
  const base = slugifyTitle(title)
  let slug = base
  let suffix = 2

  while (await prisma.list.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`
    suffix += 1
  }

  return slug
}

class ListService {
  calculateTrendingScore(params: {
    likesLast7Days: number
    viewsLast7Days: number
    commentsLast7Days: number
    activitiesLast7Days: number
    createdAt: Date
  }) {
    const {
      likesLast7Days,
      viewsLast7Days,
      commentsLast7Days,
      activitiesLast7Days,
      createdAt,
    } = params

    const baseScore =
      likesLast7Days * 3 +
      viewsLast7Days * 1 +
      commentsLast7Days * 2 +
      activitiesLast7Days * 2

    const ageDays = Math.max(0, (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const ageBoost = Math.max(0, 1 - ageDays / 60)

    return Number((baseScore + ageBoost).toFixed(4))
  }

  async recalculateTrendingScores() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [lists, recentLikes, recentActivities, recentViews] = await Promise.all([
      prisma.list.findMany({
        select: {
          id: true,
          createdAt: true,
        },
      }),
      prisma.listLike.groupBy({
        by: ["listId"],
        where: { createdAt: { gte: cutoff } },
        _count: { _all: true },
      }),
      prisma.listActivity.groupBy({
        by: ["listId"],
        where: { createdAt: { gte: cutoff } },
        _count: { _all: true },
      }),
      prisma.listView.groupBy({
        by: ["listId"],
        where: { createdAt: { gte: cutoff } },
        _count: { _all: true },
      }),
    ])

    const likesMap = new Map(recentLikes.map((row) => [row.listId, row._count._all]))
    const activityMap = new Map(recentActivities.map((row) => [row.listId, row._count._all]))
    const viewsMap = new Map(recentViews.map((row) => [row.listId, row._count._all]))

    const updates = lists.map((list) => {
      const likesLast7Days = likesMap.get(list.id) ?? 0
      const activitiesLast7Days = activityMap.get(list.id) ?? 0
      const viewsLast7Days = viewsMap.get(list.id) ?? 0

      const score = this.calculateTrendingScore({
        likesLast7Days,
        viewsLast7Days,
        commentsLast7Days: 0,
        activitiesLast7Days,
        createdAt: list.createdAt,
      })

      return prisma.list.update({
        where: { id: list.id },
        data: { trendingScore: score },
      })
    })

    await prisma.$transaction(updates)
  }

  async recalculatePopularityScores() {
    const lists = await prisma.list.findMany({
      select: {
        id: true,
        likeCount: true,
        viewCount: true,
        commentCount: true,
      },
    })

    const updates = lists.map((list) => {
      const score = list.likeCount * 2 + list.viewCount + list.commentCount * 1.5
      return prisma.list.update({
        where: { id: list.id },
        data: { popularityScore: Number(score.toFixed(2)) },
      })
    })

    await prisma.$transaction(updates)
  }
  async createList(data: CreateListInput) {
    const slug = await generateUniqueSlug(data.title)

    const list = await prisma.$transaction(async (tx) => {
      const created = await tx.list.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          userId: data.userId,
          listType: data.listType,
          privacy: data.privacy,
          isRanked: data.isRanked ?? false,
          tags: data.tags ?? [],
          slug,
          lastActivityAt: new Date(),
        },
      })

      await tx.listContributor.create({
        data: {
          listId: created.id,
          userId: data.userId,
          role: ContributorRole.OWNER,
          status: ContributorStatus.ACCEPTED,
          addedAt: new Date(),
        },
      })

      await tx.listActivity.create({
        data: {
          listId: created.id,
          userId: data.userId,
          activityType: ActivityType.LIST_CREATED,
          createdAt: new Date(),
        },
      })

      return created
    })

    return prisma.list.findUnique({
      where: { id: list.id },
      include: {
        user: true,
        contributors: {
          include: {
            user: true,
          },
        },
      },
    })
  }

  async getListById(
    listId: string,
    viewer?: { userId?: string | null; ip?: string; userAgent?: string }
  ) {
    const userId = viewer?.userId ?? null
    const canView = await canUserViewList(listId, userId)
    if (!canView) return null

      const list = await prisma.list.findUnique({
        where: { id: listId },
        include: {
          user: true,
          contributors: {
            include: {
              user: true,
            },
          },
        },
      })

    if (!list) return null

    const viewRecorded = await this.recordListView(listId, viewer)
    if (viewRecorded) {
      await prisma.list.update({
        where: { id: listId },
        data: { viewCount: { increment: 1 } },
      })
    }

    const [isLiked, isSaved, canEdit, owner] = await Promise.all([
      userId
        ? prisma.listLike.findUnique({
            where: {
              listId_userId: {
                listId,
                userId,
              },
            },
            select: { id: true },
          })
        : null,
      userId
        ? prisma.listSave.findUnique({
            where: {
              listId_userId: {
                listId,
                userId,
              },
            },
            select: { id: true },
          })
        : null,
      canUserEditList(listId, userId),
      isListOwner(listId, userId),
    ])

    const contributors =
      list.contributors
        ?.filter(
          (item) =>
            item.role === ContributorRole.OWNER ||
            item.status === ContributorStatus.ACCEPTED
        )
        .map((item) => ({
          ...item,
          role: item.role === ContributorRole.OWNER ? ContributorRole.OWNER : ContributorRole.EDITOR,
        })) ?? []

    return {
      ...list,
      contributors,
      films: [],
      isLiked: Boolean(isLiked),
      isSaved: Boolean(isSaved),
      canEdit,
      isOwner: owner,
    }
  }

  async getListFilms(listId: string, userId?: string | null, page = 1, pageSize = 24) {
    const canView = await canUserViewList(listId, userId ?? null)
    if (!canView) return null

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { id: true, isRanked: true, filmCount: true },
    })
    if (!list) return null

    const films = await prisma.listFilm.findMany({
      where: { listId },
      include: { film: true, user: true },
      orderBy: list.isRanked ? { rank: "asc" } : { addedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    return {
      films,
      page,
      pageSize,
      total: list.filmCount,
      isRanked: list.isRanked,
    }
  }

  async getListFull(listId: string, userId?: string | null, page = 1, pageSize = 24) {
    const listMeta = await prisma.list.findUnique({
      where: { id: listId },
      select: { privacy: true, isRanked: true, filmCount: true, userId: true },
    })
    if (!listMeta) return null

    let contributorRole: ContributorRole | null = null
    if (userId) {
      if (userId === listMeta.userId) {
        contributorRole = ContributorRole.OWNER
      } else {
        const contributor = await prisma.listContributor.findUnique({
          where: { listId_userId: { listId, userId } },
          select: { role: true, status: true },
        })
        contributorRole =
          contributor?.role === ContributorRole.OWNER ||
          contributor?.status === ContributorStatus.ACCEPTED
            ? contributor.role
            : null
      }
    }

    const canView =
      listMeta.privacy === ListPrivacy.PUBLIC ||
      listMeta.privacy === ListPrivacy.UNLISTED ||
      Boolean(contributorRole)
    if (!canView) return null

    const canEdit =
      contributorRole === ContributorRole.OWNER ||
      contributorRole === ContributorRole.EDITOR ||
      contributorRole === ContributorRole.CONTRIBUTOR
    const isOwner = contributorRole === ContributorRole.OWNER

    const [list, films, isLiked, isSaved] = await Promise.all([
      prisma.list.findUnique({
        where: { id: listId },
        include: {
          user: {
            select: { id: true, username: true, name: true, avatarUrl: true },
          },
          contributors: {
            include: {
              user: {
                select: { id: true, username: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      }),
      prisma.listFilm.findMany({
        where: { listId },
        orderBy: listMeta.isRanked ? { rank: "asc" } : { addedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          listId: true,
          filmId: true,
          rank: true,
          notes: true,
          addedBy: true,
          addedAt: true,
          user: {
            select: { id: true, username: true, name: true, avatarUrl: true },
          },
          film: {
            select: {
              id: true,
              title: true,
              posterPath: true,
              releaseDate: true,
              runtime: true,
              genres: true,
              director: true,
              cast: true,
              tmdbRating: true,
            },
          },
        },
      }),
      userId
        ? prisma.listLike.findUnique({
            where: { listId_userId: { listId, userId } },
            select: { id: true },
          })
        : null,
      userId
        ? prisma.listSave.findUnique({
            where: { listId_userId: { listId, userId } },
            select: { id: true },
          })
        : null,
    ])

    if (!list) return null

    const contributors = (isOwner
      ? list.contributors
      : list.contributors.filter(
          (item) =>
            item.role === ContributorRole.OWNER ||
            item.status === ContributorStatus.ACCEPTED
        )
    ).map((item) => ({
      ...item,
      role: item.role === ContributorRole.OWNER ? ContributorRole.OWNER : ContributorRole.EDITOR,
    }))

    const filmItems = films.map((item) => item.film).filter(Boolean)
    const totalRuntime = filmItems.reduce((sum, film) => sum + (film.runtime ?? 0), 0)
    const ratings = filmItems
      .map((film) => film.tmdbRating)
      .filter((value): value is number => typeof value === "number")
    const averageRating =
      ratings.length > 0
        ? Number((ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(2))
        : null

    const genreCounts = new Map<string, number>()
    filmItems.forEach((film) => {
      film.genres?.forEach((genre) => {
        if (!genre) return
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
      })
    })
    const genres = Array.from(genreCounts.entries()).map(([name, count]) => ({ name, count }))

    const decadeCounts = new Map<string, number>()
    filmItems.forEach((film) => {
      if (!film.releaseDate) return
      const year = Number(String(film.releaseDate).slice(0, 4))
      if (!Number.isFinite(year)) return
      const decade = Math.floor(year / 10) * 10
      const label = `${decade}s`
      decadeCounts.set(label, (decadeCounts.get(label) ?? 0) + 1)
    })
    const decades = Array.from(decadeCounts.entries()).map(([label, count]) => ({ label, count }))

    const filmIds = films.map((item) => item.filmId).filter(Boolean)
    let topDirector: { id: number; name: string; count: number } | null = null
    let topActor: { id: number; name: string; count: number } | null = null

    if (filmIds.length > 0) {
      const [directorGroup, actorGroup] = await Promise.all([
        prisma.filmCredit.groupBy({
          by: ["personId"],
          where: {
            filmId: { in: filmIds },
            job: "Director",
          },
          _count: { personId: true },
          orderBy: { _count: { personId: "desc" } },
          take: 1,
        }),
        prisma.filmCredit.groupBy({
          by: ["personId"],
          where: {
            filmId: { in: filmIds },
            creditType: "cast",
          },
          _count: { personId: true },
          orderBy: { _count: { personId: "desc" } },
          take: 1,
        }),
      ])

      const topDirectorPersonId = directorGroup[0]?.personId
      const topActorPersonId = actorGroup[0]?.personId
      const topPersonIds = [topDirectorPersonId, topActorPersonId].filter(
        (value): value is number => typeof value === "number"
      )

      if (topPersonIds.length > 0) {
        const people = await prisma.person.findMany({
          where: { id: { in: topPersonIds } },
          select: { id: true, name: true },
        })
        const peopleById = new Map(people.map((person) => [person.id, person.name]))

        if (typeof topDirectorPersonId === "number") {
          topDirector = {
            id: topDirectorPersonId,
            name: peopleById.get(topDirectorPersonId) ?? "Unknown",
            count: directorGroup[0]?._count.personId ?? 0,
          }
        }

        if (typeof topActorPersonId === "number") {
          topActor = {
            id: topActorPersonId,
            name: peopleById.get(topActorPersonId) ?? "Unknown",
            count: actorGroup[0]?._count.personId ?? 0,
          }
        }
      }
    }

    return {
      ...list,
      contributors,
      films,
      page,
      pageSize,
      totalFilms: listMeta.filmCount,
      isLiked: Boolean(isLiked),
      isSaved: Boolean(isSaved),
      canEdit,
      isOwner,
      comments: [],
      stats: {
        totalRuntime,
        averageRating,
        genres,
        decades,
        topDirector,
        topActor,
      },
    }
  }

  private async recordListView(
    listId: string,
    viewer?: { userId?: string | null; ip?: string; userAgent?: string }
  ) {
    const userId = viewer?.userId ?? null
    const ip = viewer?.ip
    const userAgent = viewer?.userAgent
    const recentCutoff = new Date(Date.now() - 30 * 60 * 1000)

    if (userId) {
      const recent = await prisma.listView.findFirst({
        where: { listId, userId, createdAt: { gte: recentCutoff } },
        select: { id: true },
      })
      if (recent) return false
    } else if (ip) {
      const recent = await prisma.listView.findFirst({
        where: { listId, ip, createdAt: { gte: recentCutoff } },
        select: { id: true },
      })
      if (recent) return false
    }

    await prisma.listView.create({
      data: {
        listId,
        userId,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
      },
    })

    return true
  }

  async updateList(listId: string, userId: string, data: UpdateListInput) {
    const canEdit = await canUserEditList(listId, userId)
    if (!canEdit) {
      throw new Error("Unauthorized")
    }

    const updateData: Record<string, any> = {
      description: data.description,
      privacy: data.privacy,
      listType: data.listType,
      isRanked: data.isRanked,
      tags: data.tags,
      coverImagePath: data.coverImagePath,
      pinned: data.pinned,
      lastActivityAt: new Date(),
    }

    if (data.title) {
      updateData.title = data.title
      updateData.slug = await generateUniqueSlug(data.title)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const list = await tx.list.update({
        where: { id: listId },
        data: updateData,
      })

      if (data.title) {
        await tx.listActivity.create({
          data: {
            listId,
            userId,
            activityType: ActivityType.TITLE_UPDATED,
            metadata: { title: data.title },
            createdAt: new Date(),
          },
        })
      }

      if (data.description !== undefined) {
        await tx.listActivity.create({
          data: {
            listId,
            userId,
            activityType: ActivityType.DESCRIPTION_UPDATED,
            metadata: { description: data.description },
            createdAt: new Date(),
          },
        })
      }

      return list
    })

    return updated
  }

  async updateListSettings(listId: string, userId: string, data: Pick<UpdateListInput, "privacy" | "listType" | "isRanked" | "pinned">) {
    return this.updateList(listId, userId, data)
  }

  async uploadListCover(listId: string, userId: string, file: UploadFileInput) {
    const canEdit = await canUserEditList(listId, userId)
    if (!canEdit) {
      throw new Error("Unauthorized")
    }

    const result = await uploadToCloudinary(file, `list_${listId}`)
    if (!result.secure_url) {
      throw new Error("Cloudinary did not return a secure URL")
    }

    return prisma.list.update({
      where: { id: listId },
      data: { coverImagePath: result.secure_url },
    })
  }

  async deleteList(listId: string, userId: string) {
    const owner = await isListOwner(listId, userId)
    if (!owner) {
      throw new Error("Only owner can delete list")
    }

    await prisma.list.delete({
      where: { id: listId },
    })

    return { success: true }
  }

  async addFilmToList(
    listId: string,
    filmId: number,
    userId: string,
    rank?: number,
    notes?: string | null
  ) {
    if (!(await canUserEditList(listId, userId))) {
      throw new Error("Unauthorized")
    }

    const existing = await prisma.listFilm.findUnique({
      where: { listId_filmId: { listId, filmId } },
      select: { id: true },
    })
    if (existing) {
      throw new Error("Film already in list")
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { isRanked: true },
    })

    let resolvedRank: number | null = null
    if (list?.isRanked) {
      if (typeof rank === "number") {
        resolvedRank = rank
      } else {
        const maxRank = await prisma.listFilm.aggregate({
          where: { listId },
          _max: { rank: true },
        })
        resolvedRank = (maxRank._max.rank ?? 0) + 1
      }
    }

    const created = await prisma.$transaction(async (tx) => {
      const record = await tx.listFilm.create({
        data: {
          listId,
          filmId,
          addedBy: userId,
          notes: notes ?? null,
          rank: resolvedRank,
        },
        include: { film: true },
      })

      await tx.listActivity.create({
        data: {
          listId,
          userId,
          filmId,
          activityType: ActivityType.FILM_ADDED,
        },
      })

      return record
    })

    await updateListStats(listId)
    return created
  }

  async bulkAddFilmToLists(
    userId: string,
    filmId: number,
    listIds: string[]
  ): Promise<BulkAddResult> {
    if (!listIds.length) {
      return { added: [], skipped: [], unauthorized: [] }
    }

    const contributors = await prisma.listContributor.findMany({
      where: { userId, listId: { in: listIds } },
      select: { listId: true, role: true },
    })
    const editable = new Set(
      contributors
        .filter(
          (item) =>
            item.role === ContributorRole.OWNER ||
            item.role === ContributorRole.EDITOR ||
            item.role === ContributorRole.CONTRIBUTOR
        )
        .map((item) => item.listId)
    )
    const unauthorized = listIds.filter((id) => !editable.has(id))
    const allowedIds = listIds.filter((id) => editable.has(id))
    if (!allowedIds.length) {
      return { added: [], skipped: [], unauthorized }
    }

    const [existing, listMeta] = await Promise.all([
      prisma.listFilm.findMany({
        where: { listId: { in: allowedIds }, filmId },
        select: { listId: true },
      }),
      prisma.list.findMany({
        where: { id: { in: allowedIds } },
        select: { id: true, isRanked: true },
      }),
    ])

    const existingSet = new Set(existing.map((item) => item.listId))
    const targetIds = allowedIds.filter((id) => !existingSet.has(id))
    const skipped = allowedIds.filter((id) => existingSet.has(id))
    if (!targetIds.length) {
      return { added: [], skipped, unauthorized }
    }

    const rankedIds = listMeta.filter((item) => item.isRanked).map((item) => item.id)
    const maxRanks = rankedIds.length
      ? await prisma.listFilm.groupBy({
          by: ["listId"],
          where: { listId: { in: rankedIds } },
          _max: { rank: true },
        })
      : []
    const maxRankMap = new Map(
      maxRanks.map((row) => [row.listId, row._max.rank ?? 0])
    )

    const now = new Date()
    const createRows = targetIds.map((listId) => ({
      listId,
      filmId,
      addedBy: userId,
      addedAt: now,
      rank: rankedIds.includes(listId) ? (maxRankMap.get(listId) ?? 0) + 1 : null,
    }))

    await prisma.$transaction(async (tx) => {
      await tx.listFilm.createMany({
        data: createRows,
        skipDuplicates: true,
      })
      await tx.listActivity.createMany({
        data: targetIds.map((listId) => ({
          listId,
          userId,
          filmId,
          activityType: ActivityType.FILM_ADDED,
          createdAt: now,
        })),
      })
      await Promise.all(
        targetIds.map((listId) =>
          tx.list.update({
            where: { id: listId },
            data: { filmCount: { increment: 1 }, lastActivityAt: now },
          })
        )
      )
    })

    return { added: targetIds, skipped, unauthorized }
  }

  async removeFilmFromList(listId: string, filmId: number, userId: string) {
    if (!(await canUserEditList(listId, userId))) {
      throw new Error("Unauthorized")
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { isRanked: true },
    })

    await prisma.$transaction(async (tx) => {
      await tx.listFilm.delete({
        where: { listId_filmId: { listId, filmId } },
      })

      await tx.listActivity.create({
        data: {
          listId,
          userId,
          filmId,
          activityType: ActivityType.FILM_REMOVED,
        },
      })
    })

    if (list?.isRanked) {
      const remaining = await prisma.listFilm.findMany({
        where: { listId },
        orderBy: { rank: "asc" },
      })

      const updates = remaining.map((item, index) =>
        prisma.listFilm.update({
          where: { id: item.id },
          data: { rank: index + 1 },
        })
      )
      if (updates.length) {
        await prisma.$transaction(updates)
      }
    }

    await updateListStats(listId)
    return { success: true }
  }

  async updateFilmNotes(listId: string, filmId: number, userId: string, notes?: string | null) {
    if (!(await canUserEditList(listId, userId))) {
      throw new Error("Unauthorized")
    }

    return prisma.listFilm.update({
      where: {
        listId_filmId: {
          listId,
          filmId,
        },
      },
      data: {
        notes: notes ?? null,
      },
      include: {
        film: true,
      },
    })
  }

  async reorderFilms(
    listId: string,
    userId: string,
    items: Array<{ filmId: number; rank: number }>
  ) {
    if (!(await canUserEditList(listId, userId))) {
      throw new Error("Unauthorized")
    }

    const list = await prisma.list.findUnique({
      where: { id: listId },
      select: { isRanked: true },
    })

    if (!list?.isRanked) {
      throw new Error("List is not ranked")
    }

    const updates = items.map((item) =>
      prisma.listFilm.update({
        where: {
          listId_filmId: {
            listId,
            filmId: item.filmId,
          },
        },
        data: { rank: item.rank },
      })
    )

    await prisma.$transaction([
      ...updates,
      prisma.listActivity.create({
        data: {
          listId,
          userId,
          activityType: ActivityType.FILM_REORDERED,
        },
      }),
    ])

    return { success: true }
  }

  async moveFilmUp(listId: string, filmId: number, userId: string) {
    const current = await prisma.listFilm.findUnique({
      where: { listId_filmId: { listId, filmId } },
      select: { rank: true },
    })

    if (!current?.rank || current.rank <= 1) {
      return { success: true }
    }

    const above = await prisma.listFilm.findFirst({
      where: { listId, rank: current.rank - 1 },
      select: { filmId: true },
    })

    if (!above) {
      return { success: true }
    }

    return this.reorderFilms(listId, userId, [
      { filmId, rank: current.rank - 1 },
      { filmId: above.filmId, rank: current.rank },
    ])
  }

  async moveFilmDown(listId: string, filmId: number, userId: string) {
    const current = await prisma.listFilm.findUnique({
      where: { listId_filmId: { listId, filmId } },
      select: { rank: true },
    })

    if (!current?.rank) {
      return { success: true }
    }

    const below = await prisma.listFilm.findFirst({
      where: { listId, rank: current.rank + 1 },
      select: { filmId: true },
    })

    if (!below) {
      return { success: true }
    }

    return this.reorderFilms(listId, userId, [
      { filmId, rank: current.rank + 1 },
      { filmId: below.filmId, rank: current.rank },
    ])
  }
}

export const listService = new ListService()
