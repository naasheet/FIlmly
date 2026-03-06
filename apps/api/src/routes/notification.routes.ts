import { Router } from "express"
import { param, query, validationResult } from "express-validator"
import rateLimit from "express-rate-limit"
import { authenticate } from "../middleware/auth"
import { notificationService } from "../services/notificationService"

const router = Router()

const notificationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
})

router.use(notificationLimiter)

const listValidation = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 30 }).toInt(),
  query("unreadOnly").optional().isBoolean().toBoolean(),
]

const markOneValidation = [param("id").isString().isLength({ min: 6 })]

function handleValidation(req: any, res: any) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

router.get("/", authenticate, listValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const unreadOnly = req.query.unreadOnly === true || req.query.unreadOnly === "true"

    const result = await notificationService.listForUser(userId, {
      page,
      pageSize,
      unreadOnly,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch notifications" })
  }
})

router.get("/unread-count", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const count = await notificationService.getUnreadCount(userId)
    return res.status(200).json({ unreadCount: count })
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch unread count" })
  }
})

router.post("/read-all", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await notificationService.markAllAsRead(userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to mark notifications as read" })
  }
})

router.post("/clear-all", authenticate, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await notificationService.clearAll(userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to clear notifications" })
  }
})

router.post("/:id/read", authenticate, markOneValidation, async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) return validationError

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await notificationService.markAsRead(userId, String(req.params.id))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to mark notification as read" })
  }
})

export default router
