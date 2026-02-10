import { Router } from "express"
import {
  addToDefaultHandler,
  addToDefaultValidation,
  checkDefaultHandler,
  createHandler,
  createWatchlistValidation,
  defaultFilmValidation,
  getDefaultHandler,
  listHandler,
  removeFromDefaultHandler,
  toggleDefaultHandler,
} from "../controllers/watchlistController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/", authenticate, listHandler)
router.post("/", authenticate, createWatchlistValidation, createHandler)
router.get("/default", authenticate, getDefaultHandler)
router.get("/default/items/:filmId", authenticate, defaultFilmValidation, checkDefaultHandler)
router.post("/default/items", authenticate, addToDefaultValidation, addToDefaultHandler)
router.delete("/default/items/:filmId", authenticate, defaultFilmValidation, removeFromDefaultHandler)
router.post("/default/items/:filmId/toggle", authenticate, defaultFilmValidation, toggleDefaultHandler)

export default router
