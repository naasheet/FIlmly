import { Router } from "express"
import {
    createHandler,
    createValidation,
    getOneHandler,
    getOneValidation,
    updateHandler,
    updateValidation,
    deleteHandler,
    deleteValidation,
    listByUsernameHandler,
    listValidation,
    calendarHandler,
    calendarValidation,
    statsHandler,
} from "../controllers/diaryController"
import { authenticate, optionalAuth } from "../middleware/auth"

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// Diary CRUD routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /diary - Create new diary entry
router.post("/", authenticate, createValidation, createHandler)

// GET /diary/:id - Get single diary entry
router.get("/:id", optionalAuth, getOneValidation, getOneHandler)

// PATCH /diary/:id - Update diary entry
router.patch("/:id", authenticate, updateValidation, updateHandler)

// DELETE /diary/:id - Delete diary entry
router.delete("/:id", authenticate, deleteValidation, deleteHandler)

export default router
