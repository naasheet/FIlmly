import { Router, type Request } from "express"
import multer from "multer"
import { body, param, validationResult } from "express-validator"
import { PrismaClient, ContributorRole, ListPrivacy, ListType, NotificationType, Prisma } from "@prisma/client"
import { authenticate, optionalAuth } from "../middleware/auth"
import { listService } from "../services/listService"
import { listSocialService } from "../services/listSocialService"
import { listCollaborationService } from "../services/listCollaborationService"
import { notificationService } from "../services/notificationService"
import { updateListStats } from "../utils/listStats"
import { deleteByPrefix, getCache, setCache } from "../utils/cache"

const router = Router()
const prisma = new PrismaClient()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const LIST_FULL_CACHE_TTL_MS = 5 * 60 * 1000

async function clearListCache(listId: string) {
  deleteByPrefix(`list-full:${listId}:`)
  const list = await prisma.list.findUnique({ where: { id: listId }, select: { slug: true } })
  if (list?.slug) {
    deleteByPrefix(`list-full:${list.slug}:`)
  }
}

const handleValidation = (req: any, res: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

const createValidation = [
  body("title").isString().trim().isLength({ min: 1, max: 200 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body("listType").optional().isIn(Object.values(ListType)),
  body("privacy").optional().isIn(Object.values(ListPrivacy)),
  body("isRanked").optional().isBoolean().toBoolean(),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ max: 50 }),
]

const updateValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("title").optional().isString().trim().isLength({ min: 1, max: 200 }),
  body("description").optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body("listType").optional().isIn(Object.values(ListType)),
  body("privacy").optional().isIn(Object.values(ListPrivacy)),
  body("isRanked").optional().isBoolean().toBoolean(),
  body("tags").optional().isArray(),
  body("tags.*").optional().isString().isLength({ max: 50 }),
  body("coverImagePath").optional({ nullable: true }).isString().isLength({ max: 500 }),
  body("pinned").optional().isBoolean().toBoolean(),
]

const addFilmValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("filmId").isInt({ min: 1 }).toInt(),
  body("rank").optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body("notes").optional({ nullable: true }).isString().isLength({ max: 5000 }),
]

const bulkAddFilmValidation = [
  body("filmId").isInt({ min: 1 }).toInt(),
  body("listIds").isArray({ min: 1, max: 100 }),
  body("listIds.*").isString().isLength({ min: 6 }),
]

const reorderValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("items").isArray({ min: 1 }),
  body("items.*.filmId").isInt({ min: 1 }).toInt(),
  body("items.*.rank").isInt({ min: 1 }).toInt(),
]

const inviteValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("userId").isString().isLength({ min: 6 }),
  body("role").isIn([ContributorRole.EDITOR]),
]

const acceptValidation = [
  param("contributorId").isString().isLength({ min: 6 }),
]

const removeContributorValidation = [
  param("id").isString().isLength({ min: 6 }),
  param("contributorId").isString().isLength({ min: 6 }),
]

const transferValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("newOwnerUserId").isString().isLength({ min: 6 }),
]

router.post("/", authenticate, createValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const list = await listService.createList({
      title: req.body.title,
      description: req.body.description,
      userId: req.user!.id,
      listType: (req.body.listType as ListType) ?? ListType.PERSONAL,
      privacy: (req.body.privacy as ListPrivacy) ?? ListPrivacy.PUBLIC,
      isRanked: req.body.isRanked ?? false,
      tags: req.body.tags ?? [],
    })
    if (!list) {
      return res.status(500).json({ message: "Failed to create list" })
    }
    await clearListCache(list.id)
    return res.status(201).json(list)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to create list" })
  }
})

router.get("/", optionalAuth, async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q) : ""
    const privacyParam = req.query.privacy ? String(req.query.privacy) : ""
    const typeParam = req.query.listType ? String(req.query.listType) : ""
    const categoryParam = req.query.category ? String(req.query.category) : ""
    const tagsParam = req.query.tags ? String(req.query.tags) : ""
    const filmCountRange = req.query.filmCountRange ? String(req.query.filmCountRange) : ""
    const filmId = req.query.filmId ? Number(req.query.filmId) : undefined
    const rankedOnly = req.query.rankedOnly === "true" || req.query.rankedOnly === "1"
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : "trending"
    const page = Math.max(1, req.query.page ? Number(req.query.page) : 1)
    const pageSize = Math.min(50, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 20))

    const privacyValues = privacyParam
      ? privacyParam.split(",").map((value) => value.trim()).filter(Boolean)
      : []
    const typeValues = typeParam
      ? typeParam.split(",").map((value) => value.trim()).filter(Boolean)
      : []

    const where: any = {}

    if (privacyValues.length > 0) {
      where.privacy = { in: privacyValues }
    }

    if (typeValues.length > 0) {
      where.listType = { in: typeValues }
    }

    if (rankedOnly) {
      where.isRanked = true
    }

    if (categoryParam && categoryParam !== "All") {
      where.tags = { has: categoryParam }
    }

    const tagValues = tagsParam
      ? tagsParam.split(",").map((value) => value.trim()).filter(Boolean)
      : []
    if (tagValues.length > 0) {
      where.tags = { hasSome: tagValues }
    }

    if (filmCountRange) {
      if (filmCountRange === "1-10") {
        where.filmCount = { gte: 1, lte: 10 }
      } else if (filmCountRange === "11-25") {
        where.filmCount = { gte: 11, lte: 25 }
      } else if (filmCountRange === "26-50") {
        where.filmCount = { gte: 26, lte: 50 }
      } else if (filmCountRange === "50+") {
        where.filmCount = { gte: 50 }
      }
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q] } },
        {
          films: {
            some: {
              film: {
                title: { contains: q, mode: "insensitive" },
              },
            },
          },
        },
      ]
    }

    if (filmId && !Number.isNaN(filmId)) {
      where.films = { some: { filmId } }
    }

    let orderBy: Prisma.ListOrderByWithRelationInput
    switch (sortBy) {
      case "trending":
        orderBy = { trendingScore: "desc" }
        break
      case "most_liked":
        orderBy = { likeCount: "desc" }
        break
      case "newest":
        orderBy = { createdAt: "desc" }
        break
      case "recently_updated":
        orderBy = { updatedAt: "desc" }
        break
      case "most_films":
        orderBy = { filmCount: "desc" }
        break
      case "az":
        orderBy = { title: "asc" }
        break
      default:
        orderBy = { lastActivityAt: "desc" }
        break
    }

    const lists = await prisma.list.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
        films: {
          take: 4,
          include: { film: true },
        },
      },
    })

    return res.status(200).json(lists)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch lists" })
  }
})

router.post("/bulk-add", authenticate, bulkAddFilmValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const result = await listService.bulkAddFilmToLists(
      req.user!.id,
      Number(req.body.filmId),
      Array.isArray(req.body.listIds) ? req.body.listIds : []
    )
    await Promise.all(result.added.map((listId) => clearListCache(listId)))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to add film to lists" })
  }
})

router.get("/popular-tags", optionalAuth, async (_req, res) => {
  try {
    const lists = await prisma.list.findMany({
      select: { tags: true },
      where: { tags: { isEmpty: false } },
    })
    const counts = new Map<string, number>()
    lists.forEach((list) => {
      list.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      })
    })
    const tags = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag)
    return res.status(200).json({ tags })
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch popular tags" })
  }
})

router.get("/:identifier", optionalAuth, async (req, res) => {
  try {
    const identifier = String(req.params.identifier)
    const list =
      (await prisma.list.findUnique({ where: { id: identifier }, select: { id: true } })) ??
      (await prisma.list.findUnique({ where: { slug: identifier }, select: { id: true } }))

    if (!list) {
      return res.status(404).json({ message: "List not found" })
    }

    const result = await listService.getListById(list.id, {
      userId: req.user?.id ?? null,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    })
    if (!result) {
      return res.status(404).json({ message: "List not found" })
    }
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch list" })
  }
})

  router.get("/:id/full", optionalAuth, async (req, res) => {
    try {
    const identifier = String(req.params.id)
    const page = Math.max(1, req.query.page ? Number(req.query.page) : 1)
    const pageSize = Math.min(50, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 24))
    const cacheKey = `list-full:${identifier}:${req.user?.id ?? "anon"}:${page}:${pageSize}`
    const cached = getCache<any>(cacheKey)
    if (cached) {
      return res.status(200).json(cached)
    }
    const list =
      (await prisma.list.findUnique({
        where: { id: identifier },
        select: { id: true, slug: true },
      })) ??
      (await prisma.list.findUnique({
        where: { slug: identifier },
        select: { id: true, slug: true },
      }))
    if (!list) {
      return res.status(404).json({ message: "List not found" })
    }

    const result = await listService.getListFull(list.id, req.user?.id ?? null, page, pageSize)
    if (!result) {
      return res.status(404).json({ message: "List not found" })
    }
    const idCacheKey = `list-full:${list.id}:${req.user?.id ?? "anon"}:${page}:${pageSize}`
    setCache(idCacheKey, result, LIST_FULL_CACHE_TTL_MS)
    if (identifier !== list.id) {
      setCache(cacheKey, result, LIST_FULL_CACHE_TTL_MS)
    }
    return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to fetch list" })
    }
  })

  router.get("/:id/films", optionalAuth, async (req, res) => {
    try {
      const listId = String(req.params.id)
      const page = Math.max(1, req.query.page ? Number(req.query.page) : 1)
      const pageSize = Math.min(50, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 24))
      const result = await listService.getListFilms(listId, req.user?.id ?? null, page, pageSize)
      if (!result) {
        return res.status(404).json({ message: "List not found" })
      }
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to fetch list films" })
    }
})

router.put("/:id", authenticate, updateValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const updated = await listService.updateList(String(req.params.id), req.user!.id, {
      title: req.body.title,
      description: req.body.description,
      privacy: req.body.privacy,
      listType: req.body.listType,
      isRanked: req.body.isRanked,
      tags: req.body.tags,
      coverImagePath: req.body.coverImagePath,
      pinned: req.body.pinned,
    })
    await clearListCache(String(req.params.id))
    return res.status(200).json(updated)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to update list" })
  }
})

  router.delete("/:id", authenticate, async (req, res) => {
    try {
      await listService.deleteList(String(req.params.id), req.user!.id)
      await clearListCache(String(req.params.id))
      return res.status(204).send()
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to delete list" })
    }
  })

router.post("/:id/films", authenticate, addFilmValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const record = await listService.addFilmToList(
      String(req.params.id),
      Number(req.body.filmId),
      req.user!.id,
      req.body.rank,
      req.body.notes
    )
    await clearListCache(String(req.params.id))
    return res.status(201).json(record)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to add film to list" })
  }
})

router.post("/:id/cover", authenticate, upload.single("cover"), async (req, res) => {
  try {
    const listId = String(req.params.id)
    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) {
      return res.status(400).json({ message: "Cover image is required" })
    }

    const updated = await listService.uploadListCover(listId, req.user!.id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalName: file.originalname,
    })

    await clearListCache(String(req.params.id))
    return res.status(200).json({ coverImagePath: updated.coverImagePath })
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to upload cover" })
  }
})

  router.delete("/:id/films/:filmId", authenticate, async (req, res) => {
    try {
      await listService.removeFilmFromList(
        String(req.params.id),
        Number(req.params.filmId),
        req.user!.id
      )
      await clearListCache(String(req.params.id))
      return res.status(204).send()
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to remove film from list" })
    }
  })

  router.put("/:id/films/reorder", authenticate, reorderValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const result = await listService.reorderFilms(
      String(req.params.id),
      req.user!.id,
      req.body.items
    )
    await clearListCache(String(req.params.id))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to reorder films" })
  }
})

  router.post("/:id/like", authenticate, async (req, res) => {
    try {
      const identifier = String(req.params.id)
      const list =
        (await prisma.list.findUnique({ where: { id: identifier }, select: { id: true } })) ??
        (await prisma.list.findUnique({ where: { slug: identifier }, select: { id: true } }))
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }
      const result = await listSocialService.likeList(list.id, req.user!.id)
      await clearListCache(list.id)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to like list" })
    }
  })

  router.delete("/:id/like", authenticate, async (req, res) => {
    try {
      const identifier = String(req.params.id)
      const list =
        (await prisma.list.findUnique({ where: { id: identifier }, select: { id: true } })) ??
        (await prisma.list.findUnique({ where: { slug: identifier }, select: { id: true } }))
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }
      const result = await listSocialService.unlikeList(list.id, req.user!.id)
      await clearListCache(list.id)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to unlike list" })
    }
  })

  router.post("/:id/save", authenticate, async (req, res) => {
    try {
      const identifier = String(req.params.id)
      const list =
        (await prisma.list.findUnique({ where: { id: identifier }, select: { id: true, userId: true } })) ??
        (await prisma.list.findUnique({ where: { slug: identifier }, select: { id: true, userId: true } }))
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }
      const listId = list.id
      const userId = req.user!.id
      const existing = await prisma.listSave.findUnique({
        where: { listId_userId: { listId, userId } },
        select: { id: true },
      })
      if (!existing) {
        await prisma.listSave.create({ data: { listId, userId } })
        await notificationService.create({
          recipientId: list.userId,
          actorId: userId,
          type: NotificationType.LIST_SAVED,
          listId,
        })
      }
      await updateListStats(listId)
      await clearListCache(listId)
      return res.status(200).json({ saved: true })
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to save list" })
    }
  })

  router.delete("/:id/save", authenticate, async (req, res) => {
    try {
      const identifier = String(req.params.id)
      const list =
        (await prisma.list.findUnique({ where: { id: identifier }, select: { id: true, userId: true } })) ??
        (await prisma.list.findUnique({ where: { slug: identifier }, select: { id: true, userId: true } }))
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }
      const listId = list.id
      const userId = req.user!.id
      const deleted = await prisma.listSave.deleteMany({ where: { listId, userId } })
      if (deleted.count > 0) {
        await notificationService.remove({
          recipientId: list.userId,
          actorId: userId,
          type: NotificationType.LIST_SAVED,
          listId,
        })
      }
      await updateListStats(listId)
      await clearListCache(listId)
      return res.status(200).json({ saved: false })
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to unsave list" })
    }
  })

router.get("/:id/likes", optionalAuth, async (req, res) => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const users = await listSocialService.getUsersWhoLiked(String(req.params.id), { page, pageSize })
    return res.status(200).json({ users })
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch likes" })
  }
})

router.get("/:id/activity", optionalAuth, async (req, res) => {
  try {
    const listId = String(req.params.id)
    const page = Math.max(1, req.query.page ? Number(req.query.page) : 1)
    const pageSize = Math.min(50, Math.max(1, req.query.pageSize ? Number(req.query.pageSize) : 10))
    const activities = await prisma.listActivity.findMany({
      where: { listId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
        film: { select: { id: true, title: true, posterPath: true } },
      },
    })
    return res.status(200).json({ activities })
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch activity" })
  }
})

router.post("/:id/contributors/invite", authenticate, inviteValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const invitation = await listCollaborationService.inviteContributor(
      String(req.params.id),
      String(req.body.userId),
      req.body.role as ContributorRole,
      req.user!.id
    )
    await clearListCache(String(req.params.id))
    return res.status(201).json(invitation)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to invite contributor" })
  }
})

router.post("/contributors/:contributorId/accept", authenticate, acceptValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const updated = await listCollaborationService.acceptInvitation(
      String(req.params.contributorId),
      req.user!.id
    )
    await clearListCache(updated.listId)
    return res.status(200).json(updated)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to accept invitation" })
  }
})

router.delete(
  "/:id/contributors/:contributorId",
  authenticate,
  removeContributorValidation,
  async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
      const result = await listCollaborationService.removeContributor(
        String(req.params.id),
        String(req.params.contributorId),
        req.user!.id
      )
      await clearListCache(String(req.params.id))
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Failed to remove contributor" })
    }
  }
)

router.post("/:id/transfer", authenticate, transferValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const result = await listCollaborationService.transferOwnership(
      String(req.params.id),
      String(req.body.newOwnerUserId),
      req.user!.id
    )
    await clearListCache(String(req.params.id))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to transfer ownership" })
  }
})

export default router
