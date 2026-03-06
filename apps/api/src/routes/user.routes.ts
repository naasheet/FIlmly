import { Router } from "express"
import multer from "multer"
import {
  getByUsernameHandler,
  getListsHandler,
  getMyListsHandler,
  getMeHandler,
  getReviewsHandler,
  getStatsHandler,
  getFollowersHandler,
  getFollowingHandler,
  getFollowStatusHandler,
  followUserHandler,
  unfollowUserHandler,
  getWatchedStatusHandler,
  getWatchedByUsernameHandler,
  getByIdHandler,
  updateMeHandler,
  uploadAvatarHandler,
  toggleWatchedHandler,
  linkSupabaseHandler,
  getWatchedStatusesHandler,
  getMyStatsHandler,
} from "../controllers/userController"
import {
  listByUsernameHandler,
  listValidation,
  calendarHandler,
  calendarValidation,
  statsHandler as diaryStatsHandler,
} from "../controllers/diaryController"
import { searchUsersHandler } from "../controllers/userSearchController"
import { authenticate, optionalAuth } from "../middleware/auth"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.post("/me/avatar", authenticate, upload.single("avatar"), uploadAvatarHandler)
router.get("/me", authenticate, getMeHandler)
router.get("/me/stats", authenticate, getMyStatsHandler)
router.get("/me/lists", authenticate, getMyListsHandler)
router.patch("/me", authenticate, updateMeHandler)
router.patch("/me/supabase", authenticate, linkSupabaseHandler)
router.get("/me/watched/:filmId", authenticate, getWatchedStatusHandler)
router.post("/me/watched/statuses", authenticate, getWatchedStatusesHandler)
router.post("/me/watched/:filmId", authenticate, toggleWatchedHandler)
router.get("/search", optionalAuth, searchUsersHandler)
router.get("/id/:id", optionalAuth, getByIdHandler)
router.get("/:username", optionalAuth, getByUsernameHandler)
router.get("/:username/stats", optionalAuth, getStatsHandler)
router.get("/:username/reviews", optionalAuth, getReviewsHandler)
router.get("/:username/lists", optionalAuth, getListsHandler)
router.get("/:username/watched", optionalAuth, getWatchedByUsernameHandler)
router.get("/:username/diary", optionalAuth, listValidation, listByUsernameHandler)
router.get("/:username/diary/calendar", optionalAuth, calendarValidation, calendarHandler)
router.get("/:username/diary/stats", optionalAuth, diaryStatsHandler)
router.get("/:username/followers", optionalAuth, getFollowersHandler)
router.get("/:username/following", optionalAuth, getFollowingHandler)
router.get("/:username/follow-status", authenticate, getFollowStatusHandler)
router.post("/:username/follow", authenticate, followUserHandler)
router.delete("/:username/follow", authenticate, unfollowUserHandler)

export default router
