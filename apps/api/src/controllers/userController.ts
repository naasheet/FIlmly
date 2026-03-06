import type { Request, Response } from "express"
import {
  getUserByUsername,
  getUserById,
  getUserLists,
  getUserProfile,
  getUserReviews,
  getUserStats,
  linkSupabaseUserId,
  updateProfile,
  uploadAvatar,
} from "../services/userService"
import { getWatchedByUser, getWatchedStatus, getWatchedStatuses, toggleWatched } from "../services/watchedService"
import {
  followUser,
  getFollowers,
  getFollowing,
  getMutualFollows,
  unfollowUser,
} from "../services/followService"

function asStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export async function getMeHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await getUserProfile(userId)
    return res.status(200).json(user)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch user" })
  }
}

export async function getByUsernameHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    return res.status(200).json(user)
  } catch (error: any) {
    return res.status(404).json({ message: error.message ?? "User not found" })
  }
}

export async function getByIdHandler(req: Request, res: Response) {
  try {
    const id = asStringParam(req.params.id)
    if (!id) {
      return res.status(400).json({ message: "User id is required" })
    }
    const user = await getUserById(id)
    return res.status(200).json(user)
  } catch (error: any) {
    return res.status(404).json({ message: error.message ?? "User not found" })
  }
}

export async function updateMeHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const updated = await updateProfile(userId, req.body ?? {})
    return res.status(200).json(updated)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to update profile" })
  }
}

export async function linkSupabaseHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const supabaseUserId = req.body?.supabaseUserId
    if (!supabaseUserId || typeof supabaseUserId !== "string") {
      return res.status(400).json({ message: "supabaseUserId is required" })
    }
    const updated = await linkSupabaseUserId(userId, supabaseUserId)
    return res.status(200).json(updated)
  } catch (error: any) {
    return res.status(400).json({ message: error.message ?? "Failed to link Supabase user" })
  }
}

export async function uploadAvatarHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const file = (req as Request & { file?: Express.Multer.File }).file
    if (!file) {
      return res.status(400).json({ message: "Avatar file is required" })
    }

    const updated = await uploadAvatar(userId, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalName: file.originalname,
    })

    return res.status(200).json({
      avatarUrl: updated.avatarUrl,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to upload avatar" })
  }
}

export async function getStatsHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const stats = await getUserStats(user.id)
    return res.status(200).json(stats)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch stats" })
  }
}

export async function getMyStatsHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const stats = await getUserStats(userId)
    return res.status(200).json(stats)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch stats" })
  }
}

export async function getReviewsHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const reviews = await getUserReviews(user.id)
    return res.status(200).json(reviews)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch reviews" })
  }
}

export async function getListsHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const lists = await getUserLists(user.id)
    return res.status(200).json(lists)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch lists" })
  }
}

export async function getMyListsHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const lists = await getUserLists(userId)
    return res.status(200).json(lists)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch lists" })
  }
}

export async function getFollowersHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const followers = await getFollowers(user.id)
    return res.status(200).json({
      count: followers.length,
      followers,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch followers" })
  }
}

export async function getFollowingHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const following = await getFollowing(user.id)
    return res.status(200).json({
      count: following.length,
      following,
    })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch following" })
  }
}

export async function getFollowStatusHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const viewerId = req.user?.id
    if (!viewerId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await getUserByUsername(username)
    const following = await getFollowing(viewerId)
    const isFollowing = following.some((item) => item.followingId === user.id)
    return res.status(200).json({ following: isFollowing })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch follow status" })
  }
}

export async function followUserHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const viewerId = req.user?.id
    if (!viewerId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await getUserByUsername(username)
    const result = await followUser(viewerId, user.id)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to follow user" })
  }
}

export async function unfollowUserHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const viewerId = req.user?.id
    if (!viewerId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const user = await getUserByUsername(username)
    const result = await unfollowUser(viewerId, user.id)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to unfollow user" })
  }
}

export async function getWatchedStatusHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const filmId = Number(req.params.filmId)
    if (!filmId || Number.isNaN(filmId)) {
      return res.status(400).json({ message: "Invalid film id" })
    }
    const status = await getWatchedStatus(userId, filmId)
    return res.status(200).json(status)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch watched" })
  }
}

export async function toggleWatchedHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const filmId = Number(req.params.filmId)
    if (!filmId || Number.isNaN(filmId)) {
      return res.status(400).json({ message: "Invalid film id" })
    }
    const result = await toggleWatched(userId, filmId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to update watched" })
  }
}

export async function getWatchedByUsernameHandler(req: Request, res: Response) {
  try {
    const username = asStringParam(req.params.username)
    if (!username) {
      return res.status(400).json({ message: "Username is required" })
    }
    const user = await getUserByUsername(username)
    const watched = await getWatchedByUser(user.id)
    return res.status(200).json(watched)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch watched" })
  }
}

export async function getWatchedStatusesHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const ids = Array.isArray(req.body?.filmIds) ? req.body.filmIds : []
    const filmIds = ids
      .map((value: any) => Number(value))
      .filter((value: number) => !Number.isNaN(value))

    const statuses = await getWatchedStatuses(userId, filmIds)
    return res.status(200).json({ statuses })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch watched statuses" })
  }
}
