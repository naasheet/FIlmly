import type { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import { PrismaClient } from "@prisma/client"
import {
    createEntry,
    updateEntry,
    deleteEntry,
    getEntry,
    getUserDiary,
    getDiaryCalendar,
    getDiaryStats,
} from "../services/diaryService"

const prisma = new PrismaClient()

type Handler = (req: Request, res: Response) => Promise<Response>

function handleValidation(req: Request, res: Response) {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export const createValidation = [
    body("filmId").isInt({ min: 1 }).toInt(),
    body("watchedDate").optional().isISO8601(),
    body("mood").optional({ nullable: true }).isString().isLength({ max: 50 }),
    body("rating").optional({ nullable: true }).isFloat({ min: 0.5, max: 5 }).toFloat(),
    body("location").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("venue").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("format").optional({ nullable: true }).isString().isLength({ max: 50 }),
    body("vibes").optional().isArray(),
    body("vibes.*").optional().isString().isLength({ max: 50 }),
    body("companions").optional().isArray(),
    body("companions.*").optional().isString().isLength({ max: 100 }),
    body("notes").optional({ nullable: true }).isString().isLength({ max: 5000 }),
    body("isPrivate").optional().isBoolean().toBoolean(),
    body("linkToReview").optional().isBoolean().toBoolean(),
]

export const updateValidation = [
    param("id").isString().isLength({ min: 6 }),
    body("watchedDate").optional().isISO8601(),
    body("mood").optional({ nullable: true }).isString().isLength({ max: 50 }),
    body("rating").optional({ nullable: true }).isFloat({ min: 0.5, max: 5 }).toFloat(),
    body("location").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("venue").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("format").optional({ nullable: true }).isString().isLength({ max: 50 }),
    body("vibes").optional().isArray(),
    body("vibes.*").optional().isString().isLength({ max: 50 }),
    body("companions").optional().isArray(),
    body("companions.*").optional().isString().isLength({ max: 100 }),
    body("notes").optional({ nullable: true }).isString().isLength({ max: 5000 }),
    body("isPrivate").optional().isBoolean().toBoolean(),
    body("linkToReview").optional().isBoolean().toBoolean(),
]

export const getOneValidation = [param("id").isString().isLength({ min: 6 })]
export const deleteValidation = [param("id").isString().isLength({ min: 6 })]

export const listValidation = [
    param("username").isString().isLength({ min: 1 }),
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("pageSize").optional().isInt({ min: 1, max: 50 }).toInt(),
    query("sortBy").optional().isIn(["newest", "oldest"]),
    query("location").optional().isString(),
    query("format").optional().isString(),
    query("year").optional().isInt({ min: 1900, max: 2100 }).toInt(),
    query("month").optional().isInt({ min: 1, max: 12 }).toInt(),
]

export const calendarValidation = [
    param("username").isString().isLength({ min: 1 }),
    query("year").isInt({ min: 1900, max: 2100 }).toInt(),
    query("month").optional().isInt({ min: 1, max: 12 }).toInt(),
]

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

export const createHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const result = await createEntry({
            userId,
            filmId: Number(req.body.filmId),
            watchedDate: req.body.watchedDate,
            mood: req.body.mood,
            rating: req.body.rating,
            location: req.body.location,
            venue: req.body.venue,
            format: req.body.format,
            vibes: req.body.vibes,
            companions: req.body.companions,
            notes: req.body.notes,
            isPrivate: req.body.isPrivate,
            linkToReview: req.body.linkToReview,
        })

        return res.status(201).json(result)
    } catch (error: any) {
        return res.status(400).json({ message: error.message ?? "Failed to create diary entry" })
    }
}

export const getOneHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const requesterId = req.user?.id
        const result = await getEntry(String(req.params.id), requesterId)
        return res.status(200).json(result)
    } catch (error: any) {
        const message = error.message ?? "Diary entry not found"
        const status = message.includes("private") ? 403 : 404
        return res.status(status).json({ message })
    }
}

export const updateHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const result = await updateEntry(String(req.params.id), userId, {
            watchedDate: req.body.watchedDate,
            mood: req.body.mood,
            rating: req.body.rating,
            location: req.body.location,
            venue: req.body.venue,
            format: req.body.format,
            vibes: req.body.vibes,
            companions: req.body.companions,
            notes: req.body.notes,
            isPrivate: req.body.isPrivate,
            linkToReview: req.body.linkToReview,
        })

        return res.status(200).json(result)
    } catch (error: any) {
        const message = error.message ?? "Failed to update diary entry"
        const status = message.includes("Not authorized") ? 403 : 400
        return res.status(status).json({ message })
    }
}

export const deleteHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const userId = req.user?.id
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const result = await deleteEntry(String(req.params.id), userId)
        return res.status(200).json(result)
    } catch (error: any) {
        const message = error.message ?? "Failed to delete diary entry"
        const status = message.includes("Not authorized") ? 403 : 400
        return res.status(status).json({ message })
    }
}

export const listByUsernameHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const username = String(req.params.username)
        const requesterId = req.user?.id

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const result = await getUserDiary(user.id, requesterId, {
            page: req.query.page ? Number(req.query.page) : undefined,
            pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
            sortBy: req.query.sortBy as "newest" | "oldest" | undefined,
            location: req.query.location ? String(req.query.location) : undefined,
            format: req.query.format ? String(req.query.format) : undefined,
            year: req.query.year ? Number(req.query.year) : undefined,
            month: req.query.month ? Number(req.query.month) : undefined,
        })

        return res.status(200).json(result)
    } catch (error: any) {
        return res.status(400).json({ message: error.message ?? "Failed to fetch diary" })
    }
}

export const calendarHandler: Handler = async (req, res) => {
    const validationError = handleValidation(req, res)
    if (validationError) return validationError

    try {
        const username = String(req.params.username)
        const requesterId = req.user?.id

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const result = await getDiaryCalendar(user.id, requesterId, {
            year: Number(req.query.year),
            month: req.query.month ? Number(req.query.month) : undefined,
        })

        return res.status(200).json(result)
    } catch (error: any) {
        return res.status(400).json({ message: error.message ?? "Failed to fetch diary calendar" })
    }
}

export const statsHandler: Handler = async (req, res) => {
    try {
        const username = String(req.params.username)

        // Find user by username
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
        })

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const result = await getDiaryStats(user.id)
        return res.status(200).json(result)
    } catch (error: any) {
        return res.status(400).json({ message: error.message ?? "Failed to fetch diary stats" })
    }
}
