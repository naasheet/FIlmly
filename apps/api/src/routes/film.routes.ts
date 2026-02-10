import { Router } from "express"
import {
  getDetailsHandler,
  getDetailsValidation,
  getImagesHandler,
  getPopularHandler,
  getPopularValidation,
  getOscarsHandler,
  getOscarsValidation,
  getListsForFilmHandler,
  getListsValidation,
  getSimilarHandler,
  getSimilarValidation,
  getTrendingHandler,
  getTrendingValidation,
  getForFilmHandler,
  getForFilmValidation,
  searchHandler,
  searchValidation,
} from "../controllers/filmController"
import { optionalAuth } from "../middleware/auth"

const router = Router()

router.get("/search", searchValidation, searchHandler)
router.get("/popular", getPopularValidation, getPopularHandler)
router.get("/trending", getTrendingValidation, getTrendingHandler)
router.get("/:id/similar", getSimilarValidation, getSimilarHandler)
router.get("/:id/oscars", getOscarsValidation, getOscarsHandler)
router.get("/:id/lists", getListsValidation, getListsForFilmHandler)
router.get("/:id/reviews", getForFilmValidation, getForFilmHandler)
router.get("/:id/images", optionalAuth, getImagesHandler)
router.get("/:id", getDetailsValidation, getDetailsHandler)

export default router
