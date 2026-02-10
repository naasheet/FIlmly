import type { Request, Response } from "express"
import { body, param, validationResult } from "express-validator"
import {
  addToDefaultWatchlist,
  createWatchlist,
  getDefaultWatchlist,
  isInDefaultWatchlist,
  listWatchlists,
  removeFromDefaultWatchlist,
  toggleDefaultWatchlist,
} from "../services/watchlistService"

type Handler = (req: Request, res: Response) => Promise<Response>

function handleValidation(req: Request, res: Response) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return null
}

export const createWatchlistValidation = [
  body("name").isString().trim().isLength({ min: 2, max: 60 }),
  body("description").optional().isString().isLength({ max: 200 }),
]

export const defaultFilmValidation = [param("filmId").isInt({ min: 1 }).toInt()]

export const addToDefaultValidation = [body("filmId").isInt({ min: 1 }).toInt()]

export const listHandler: Handler = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await listWatchlists(userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to list watchlists" })
  }
}

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
    const result = await createWatchlist(userId, {
      name: req.body.name,
      description: req.body.description,
    })
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to create watchlist" })
  }
}

export const getDefaultHandler: Handler = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await getDefaultWatchlist(userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to fetch watchlist" })
  }
}

export const addToDefaultHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await addToDefaultWatchlist(userId, Number(req.body.filmId))
    return res.status(201).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to add film" })
  }
}

export const removeFromDefaultHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await removeFromDefaultWatchlist(userId, Number(req.params.filmId))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to remove film" })
  }
}

export const checkDefaultHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await isInDefaultWatchlist(userId, Number(req.params.filmId))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to check watchlist" })
  }
}

export const toggleDefaultHandler: Handler = async (req, res) => {
  const validationError = handleValidation(req, res)
  if (validationError) {
    return validationError
  }

  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const result = await toggleDefaultWatchlist(userId, Number(req.params.filmId))
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to toggle watchlist" })
  }
}
