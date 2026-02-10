import type { Request, Response } from "express"
import { personService } from "../services/personService"
import { getPersonCredits, getPersonImages, searchPeople } from "../services/tmdbService"

class PersonController {
  async getDetails(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id)
      if (!personId || Number.isNaN(personId)) {
        return res.status(400).json({ message: "Invalid person id" })
      }
      const result = await personService.getPersonWithCredits(personId)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to fetch person" })
    }
  }

  async getCredits(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id)
      if (!personId || Number.isNaN(personId)) {
        return res.status(400).json({ message: "Invalid person id" })
      }
      const credits = await getPersonCredits(personId)
      return res.status(200).json(credits)
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message ?? "Failed to fetch person credits" })
    }
  }

  async getImages(req: Request, res: Response) {
    try {
      const personId = Number(req.params.id)
      if (!personId || Number.isNaN(personId)) {
        return res.status(400).json({ message: "Invalid person id" })
      }
      const images = await getPersonImages(personId)
      return res.status(200).json(images)
    } catch (error: any) {
      return res
        .status(500)
        .json({ message: error.message ?? "Failed to fetch person images" })
    }
  }

  async search(req: Request, res: Response) {
    try {
      const query = String(req.query.query ?? "").trim()
      const page = Number(req.query.page ?? 1)
      if (!query) {
        return res
          .status(200)
          .json({ page: 1, results: [], total_pages: 1, total_results: 0 })
      }
      const results = await searchPeople(query, page)
      return res.status(200).json(results)
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Failed to search people" })
    }
  }
}

export const personController = new PersonController()
