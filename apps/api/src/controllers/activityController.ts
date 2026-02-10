import type { Request, Response } from "express"
import { getActivityFeed, getGlobalFeed } from "../services/activityService"
import { getMutualFollows } from "../services/followService"

function parsePaging(req: Request) {
  const page = req.query.page ? Number(req.query.page) : 1
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20
  const type = req.query.type ? String(req.query.type) : undefined
  return { page, pageSize, type }
}

export async function getActivityHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const { page, pageSize, type } = parsePaging(req)
    const friendsOnly = String(req.query.friends ?? "false") === "true"

    if (friendsOnly) {
      const mutual = await getMutualFollows(userId)
      const feed = await getGlobalFeed({
        page,
        pageSize,
      })
      const filtered = feed.results.filter((activity) =>
        mutual.mutual.includes(activity.userId),
      )
      const results = type
        ? filtered.filter((activity) => activity.type === type)
        : filtered
      return res.status(200).json({
        ...feed,
        results,
        total: results.length,
        totalPages: 1,
      })
    }

    const feed = await getActivityFeed(userId, { page, pageSize }, type)
    return res.status(200).json(feed)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch activity" })
  }
}

export async function getGlobalActivityHandler(req: Request, res: Response) {
  try {
    const { page, pageSize, type } = parsePaging(req)
    const feed = await getGlobalFeed({ page, pageSize })
    if (type) {
      const results = feed.results.filter((activity) => activity.type === type)
      return res.status(200).json({
        ...feed,
        results,
        total: results.length,
        totalPages: Math.ceil(results.length / feed.pageSize),
      })
    }
    return res.status(200).json(feed)
  } catch (error: any) {
    return res
      .status(500)
      .json({ message: error.message ?? "Failed to fetch global activity" })
  }
}
