import type { Request, Response } from "express"
import { body, param, query, validationResult } from "express-validator"
import {
  createReview,
  deleteReview,
  getFilmReviews,
  getReview,
  addReviewComment,
  listReviewComments,
  getUserReviews,
  reportReview,
  toggleLike,
  updateReview,
} from "../services/reviewService"

type Handler = (req: Request, res: Response) => Promise<Response>

function handleValidation(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

export const createValidation = [
  body("filmId").isInt({ min: 1 }).toInt(),
  body("title").isString().trim().isLength({ min: 1, max: 120 }),
  body("rating").isFloat({ min: 0.5, max: 5 }).toFloat(),
  body("comment").optional().isString().isLength({ max: 2000 }),
  body("containsSpoilers").optional().isBoolean().toBoolean(),
  body("rewatch").optional().isBoolean().toBoolean(),
  body("watchedDate").optional().isISO8601(),
]

export const updateValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("rating").optional().isFloat({ min: 0.5, max: 5 }).toFloat(),
  body("comment").optional().isString().isLength({ max: 2000 }),
  body("containsSpoilers").optional().isBoolean().toBoolean(),
  body("rewatch").optional().isBoolean().toBoolean(),
  body("watchedDate").optional().isISO8601(),
]

export const deleteValidation = [param("id").isString().isLength({ min: 6 })]

export const getOneValidation = [param("id").isString().isLength({ min: 6 })]

export const getForFilmValidation = [
  param("filmId").isInt({ min: 1 }).toInt(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("pageSize").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("sortBy")
    .optional()
    .isIn(["newest", "oldest", "highest_rating", "lowest_rating", "most_liked"]),
]

export const toggleLikeValidation = [param("id").isString().isLength({ min: 6 })]
export const commentValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("content").isString().trim().isLength({ min: 1, max: 2000 }),
]
export const reportValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("reason").isString().trim().isLength({ min: 3, max: 60 }),
  body("details").optional().isString().isLength({ max: 500 }),
]

export const createHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { filmId, rating, comment, title } = req.body
    const result = await createReview({
      userId,
      filmId: Number(filmId),
      title: String(title).trim(),
      rating: Number(rating),
      comment,
      containsSpoilers: req.body.containsSpoilers,
      rewatch: req.body.rewatch,
      watchedDate: req.body.watchedDate,
    })
    return res.status(201).json(result)
  } catch (error: any) {
    const message = error.message ?? "Failed to create review"
    const status = message.includes("already reviewed") ? 409 : 400
    return res.status(status).json({ message })
  }
}

export const updateHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const reviewId = String(req.params.id)
    const result = await updateReview(reviewId, userId, {
      title: req.body.title,
      rating: req.body.rating,
      comment: req.body.comment,
      containsSpoilers: req.body.containsSpoilers,
      rewatch: req.body.rewatch,
      watchedDate: req.body.watchedDate,
    })
    return res.status(200).json(result)
  } catch (error: any) {
    if (error.message === "Not authorized to update this review") {
      return res.status(403).json({ message: error.message })
    }
    return res.status(400).json({ message: error.message ?? "Failed to update review" })
  }
}

export const deleteHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await deleteReview(String(req.params.id), userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to delete review" })
  }
}

export const getOneHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const result = await getReview(String(req.params.id))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(404).json({ message: error.message ?? "Review not found" })
  }
}

export const getForFilmHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const filmId = Number(req.params.filmId)
    const page = req.query.page ? Number(req.query.page) : undefined
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined
    const sortBy = req.query.sortBy
      ? (String(req.query.sortBy) as Parameters<typeof getFilmReviews>[1]["sortBy"])
      : undefined
    const result = await getFilmReviews(filmId, { page, pageSize, sortBy })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch reviews" })
  }
}

export const toggleLikeHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await toggleLike(String(req.params.id), userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to toggle like" })
  }
}

export const addCommentHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await addReviewComment(String(req.params.id), userId, req.body.content)
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to add comment" })
  }
}

export const listCommentsHandler: Handler = async (req, res) => {
  try {
    const result = await listReviewComments(String(req.params.id))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch comments" })
  }
}

export const reportHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await reportReview(
      String(req.params.id),
      userId,
      req.body.reason,
      req.body.details,
    )
    return res.status(201).json(result)
  } catch (error: any) {
    const message = error.message ?? "Failed to report review"
    const status = message.includes("already reported") ? 409 : 400
    return res.status(status).json({ message })
  }
}

export const getMyReviewsHandler: Handler = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await getUserReviews(userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch reviews" })
  }
}
