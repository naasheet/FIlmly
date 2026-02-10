import type { Request, Response } from "express"
import { addComment, deleteComment, getComments } from "../services/commentService"

export async function addCommentHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const activityId = String(req.params.activityId)
    const content = String(req.body?.content ?? "").trim()
    const parentId = req.body?.parentId ? String(req.body.parentId) : null
    if (!content) {
      return res.status(400).json({ message: "Content is required" })
    }
    const comment = await addComment({ activityId, userId, content, parentId })
    return res.status(201).json(comment)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to add comment" })
  }
}

export async function getCommentsHandler(req: Request, res: Response) {
  try {
    const activityId = String(req.params.activityId)
    const comments = await getComments(activityId)
    return res.status(200).json(comments)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to fetch comments" })
  }
}

export async function deleteCommentHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    const commentId = String(req.params.commentId)
    const result = await deleteComment(commentId, userId)
    return res.status(200).json(result)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to delete comment" })
  }
}
