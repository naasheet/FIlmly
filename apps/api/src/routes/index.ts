import { Router } from "express"
import v1Routes from "./v1"
import healthRouter from "./health"

const router = Router()

router.use("/health", healthRouter)
router.use("/v1", v1Routes)

export default router
