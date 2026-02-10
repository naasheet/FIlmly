import { Router } from "express"
import {
  createHandler,
  createValidation,
  deleteHandler,
  deleteValidation,
  getOneHandler,
  getOneValidation,
  addCommentHandler,
  commentValidation,
  getMyReviewsHandler,
  listCommentsHandler,
  reportHandler,
  reportValidation,
  toggleLikeHandler,
  toggleLikeValidation,
  updateHandler,
  updateValidation,
} from "../controllers/reviewController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.post("/", authenticate, createValidation, createHandler)
router.get("/me", authenticate, getMyReviewsHandler)
router.get("/:id", getOneValidation, getOneHandler)
router.get("/:id/comments", listCommentsHandler)
router.patch("/:id", authenticate, updateValidation, updateHandler)
router.delete("/:id", authenticate, deleteValidation, deleteHandler)
router.post("/:id/like", authenticate, toggleLikeValidation, toggleLikeHandler)
router.post("/:id/comments", authenticate, commentValidation, addCommentHandler)
router.post("/:id/report", authenticate, reportValidation, reportHandler)

export default router
