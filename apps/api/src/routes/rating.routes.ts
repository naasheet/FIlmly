import { Router } from "express"
import { authenticate } from "../middleware/auth"
import {
  createHandler,
  createValidation,
  deleteHandler,
  deleteValidation,
  getForFilmHandler,
  getForFilmValidation,
  updateHandler,
  updateValidation,
} from "../controllers/ratingController"

const router = Router()

router.post("/", authenticate, createValidation, createHandler)
router.get("/film/:filmId", authenticate, getForFilmValidation, getForFilmHandler)
router.patch("/:id", authenticate, updateValidation, updateHandler)
router.delete("/:id", authenticate, deleteValidation, deleteHandler)

export default router
