import { useEffect, useMemo, useState } from "react"
import api, { normalizeApiError } from "../../services/api"
import { useAuthStore } from "../../stores/authStore"

type CommentUser = {
  id: string
  username?: string | null
  name?: string | null
}

type CommentItem = {
  id: string
  content: string
  createdAt: string
  user: CommentUser
  replies?: CommentItem[]
}

type CommentSectionProps = {
  activityId: string
}

function formatTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime()
  const seconds = Math.max(1, Math.floor(diffMs / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function CommentSection({ activityId }: CommentSectionProps) {
  const user = useAuthStore((state) => state.user)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)

  const flatCount = useMemo(() => {
    const countReplies = (items: CommentItem[]): number =>
      items.reduce((total, item) => total + 1 + countReplies(item.replies ?? []), 0)
    return countReplies(comments)
  }, [comments])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    api
      .get(`/activity/${activityId}/comments`)
      .then((res) => {
        if (active) setComments((res.data as CommentItem[]) ?? [])
      })
      .catch((err) => {
        if (active) setError(normalizeApiError(err))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [activityId])

  const handleSubmit = async () => {
    if (!input.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await api.post(`/activity/${activityId}/comments`, {
        content: input.trim(),
        parentId: replyTo?.id ?? null,
      })
      const newComment = res.data as CommentItem
      if (replyTo) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyTo.id
              ? { ...comment, replies: [...(comment.replies ?? []), newComment] }
              : comment
          )
        )
      } else {
        setComments((prev) => [...prev, newComment])
      }
      setInput("")
      setReplyTo(null)
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  const renderComments = (items: CommentItem[], depth = 0) => {
    if (depth > 2) return null
    return (
      <div className={depth === 0 ? "space-y-3" : "mt-3 space-y-3"}>
        {items.map((comment) => (
          <div
            key={comment.id}
            className={`rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 ${
              depth > 0 ? "ml-4" : ""
            }`}
          >
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span className="font-semibold text-white">
                {comment.user?.name ?? comment.user?.username ?? "User"}
              </span>
              <span className="text-xs text-slate-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-300">{comment.content}</p>
            {user && depth < 2 && (
              <button
                type="button"
                onClick={() => setReplyTo(comment)}
                className="mt-2 text-xs font-semibold text-indigo-200 hover:text-indigo-100"
              >
                Reply
              </button>
            )}
            {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Comments</h3>
        <span className="text-sm text-slate-400">{flatCount}</span>
      </div>

      {loading && <p className="mt-3 text-sm text-slate-400">Loading comments...</p>}
      {error && (
        <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {!loading && comments.length === 0 && (
        <p className="mt-3 text-sm text-slate-400">No comments yet.</p>
      )}

      {comments.length > 0 && <div className="mt-4">{renderComments(comments)}</div>}

      <div className="mt-4">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
            Replying to {replyTo.user?.name ?? replyTo.user?.username ?? "User"}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
        )}
        {user ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={3}
              placeholder="Write a comment..."
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="self-end rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Log in to comment.</p>
        )}
      </div>
    </div>
  )
}
