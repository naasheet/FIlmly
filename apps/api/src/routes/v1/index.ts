import { Router } from "express"
import authRoutes from "../auth.routes"
import diaryRoutes from "../diary.routes"
import filmRoutes from "../film.routes"
import personRoutes from "../person.routes"
import reviewRoutes from "../review.routes"
import ratingRoutes from "../rating.routes"
import userRoutes from "../user.routes"
import watchlistRoutes from "../watchlist.routes"
import chatRoutes from "../chat.routes"
import listRoutes from "../list.routes"
import notificationRoutes from "../notification.routes"
import { authenticate } from "../../middleware/auth"

const router = Router()

router.use("/auth", authRoutes)
router.use("/diary", diaryRoutes)
router.use("/films", filmRoutes)
router.use("/people", personRoutes)
router.use("/reviews", reviewRoutes)
router.use("/ratings", ratingRoutes)
router.use("/users", userRoutes)
router.use("/watchlist", watchlistRoutes)
router.use("/chat", chatRoutes)
router.use("/lists", listRoutes)
router.use("/notifications", notificationRoutes)
router.get("/me", authenticate, (req, res) => {
  return res.json({ user: req.user })
})

export default router
