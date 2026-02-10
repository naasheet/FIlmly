import type { Request, Response } from "express"
import { body, param, validationResult } from "express-validator"
import { addRating, deleteRating, getUserRatingForFilm, updateRating } from "../services/ratingService"

type Handler = (req: Request, res: Response) => Promise<Response>

function handleValidation(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

const isHalfStep = (value: number) => Number.isInteger(value * 2)

export const createValidation = [
  body("filmId").isInt({ min: 1 }).toInt(),
  body("rating")
    .isFloat({ min: 0.5, max: 5 })
    .custom((value) => isHalfStep(Number(value)))
    .toFloat(),
]

export const updateValidation = [
  param("id").isString().isLength({ min: 6 }),
  body("rating")
    .isFloat({ min: 0.5, max: 5 })
    .custom((value) => isHalfStep(Number(value)))
    .toFloat(),
]

export const deleteValidation = [param("id").isString().isLength({ min: 6 })]
export const getForFilmValidation = [param("filmId").isInt({ min: 1 }).toInt()]

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
    const { filmId, rating } = req.body
    const result = await addRating({
      userId,
      filmId: Number(filmId),
      rating: Number(rating),
    })
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to add rating" })
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
    const result = await updateRating(String(req.params.id), userId, {
      rating: Number(req.body.rating),
    })
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to update rating" })
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
    const result = await deleteRating(String(req.params.id), userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to delete rating" })
  }
}

export const getForFilmHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const filmId = Number(req.params.filmId)
    const result = await getUserRatingForFilm(userId, filmId)
    return res.status(200).json(result ?? null)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch rating" })
  }
}
