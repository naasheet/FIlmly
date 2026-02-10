import { Router } from "express"
import { personController } from "../controllers/personController"
import { optionalAuth } from "../middleware/auth"

const router = Router()

router.get("/search", optionalAuth, (req, res) => personController.search(req, res))
router.get("/:id", optionalAuth, (req, res) => personController.getDetails(req, res))
router.get("/:id/credits", optionalAuth, (req, res) => personController.getCredits(req, res))
router.get("/:id/images", optionalAuth, (req, res) => personController.getImages(req, res))

export default router
