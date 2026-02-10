import { Router } from "express"
import {
  getActivityHandler,
  getGlobalActivityHandler,
} from "../controllers/activityController"
import { authenticate, optionalAuth } from "../middleware/auth"

const router = Router()

router.get("/", authenticate, getActivityHandler)
router.get("/global", optionalAuth, getGlobalActivityHandler)

export default router
