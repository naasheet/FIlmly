import type { Request, Response } from "express"
import { supabaseAdmin } from "../services/supabaseAdmin"

export async function updateMessageHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const messageId = req.params.id
    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" })
    }

    const { content, is_spoiler } = req.body ?? {}

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("id, user_id")
      .eq("id", messageId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ message: "Message not found" })
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this message" })
    }

    const updates: Record<string, unknown> = {
      is_edited: true,
    }
    if (typeof content === "string") updates.content = content
    if (typeof is_spoiler === "boolean") updates.is_spoiler = is_spoiler

    const { data, error } = await supabaseAdmin
      .from("messages")
      .update(updates)
      .eq("id", messageId)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to update message" })
  }
}

export async function deleteMessageHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const messageId = req.params.id
    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("id, user_id")
      .eq("id", messageId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ message: "Message not found" })
    }

    if (existing.user_id !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this message" })
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", messageId)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to delete message" })
  }
}

export async function updateReactionsHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const messageId = req.params.id
    if (!messageId) {
      return res.status(400).json({ message: "Message id is required" })
    }

    const { reactions } = req.body ?? {}
    if (!Array.isArray(reactions)) {
      return res.status(400).json({ message: "Reactions must be an array" })
    }

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("messages")
      .select("id")
      .eq("id", messageId)
      .single()

    if (fetchError || !existing) {
      return res.status(404).json({ message: "Message not found" })
    }

    const { data, error } = await supabaseAdmin
      .from("messages")
      .update({ reactions })
      .eq("id", messageId)
      .select("*")
      .single()

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    return res.status(200).json(data)
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to update reactions" })
  }
}
