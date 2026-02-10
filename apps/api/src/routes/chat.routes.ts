import { Router } from "express"
import { authenticate } from "../middleware/auth"
import { deleteMessageHandler, updateMessageHandler, updateReactionsHandler } from "../controllers/chatController"

const router = Router()

router.patch("/messages/:id", authenticate, updateMessageHandler)
router.patch("/messages/:id/reactions", authenticate, updateReactionsHandler)
router.delete("/messages/:id", authenticate, deleteMessageHandler)

export default router
