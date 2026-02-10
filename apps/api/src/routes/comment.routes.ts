import { Router } from "express"
import {
  addCommentHandler,
  deleteCommentHandler,
  getCommentsHandler,
} from "../controllers/commentController"
import { authenticate, optionalAuth } from "../middleware/auth"

const router = Router()

router.get("/activity/:activityId/comments", optionalAuth, getCommentsHandler)
router.post("/activity/:activityId/comments", authenticate, addCommentHandler)
router.delete("/activity/comments/:commentId", authenticate, deleteCommentHandler)

export default router
