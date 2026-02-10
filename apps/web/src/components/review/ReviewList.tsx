import { useEffect, useMemo, useState } from "react"
import api, { normalizeApiError } from "../../services/api"
import ReviewCard from "./ReviewCard"
import { useAuthStore } from "../../stores/authStore"

type ReviewUser = {
  id: string
  name?: string | null
  email?: string | null
  avatarUrl?: string | null
}

type ReviewItem = {
  id: string
  userId: string
  user?: ReviewUser
  rating: number
  comment?: string | null
  createdAt?: string
  containsSpoilers?: boolean
  rewatch?: boolean
  likes?: { id: string }[]
  _count?: { likes: number; comments: number }
  watchedDate?: string | null
}

type ReviewResponse = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  results: ReviewItem[]
}

type ReviewListProps = {
  filmId: number
  refreshKey?: number
  onReviewDeleted?: (reviewId: string) => void
}

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest_rating", label: "Highest rating" },
  { value: "lowest_rating", label: "Lowest rating" },
  { value: "most_liked", label: "Most liked" },
] as const

export default function ReviewList({ filmId, refreshKey, onReviewDeleted }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(8)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]["value"]>("newest")
  const [hideSpoilers, setHideSpoilers] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [replyTextByReview, setReplyTextByReview] = useState<Record<string, string>>({})
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [commentsByReview, setCommentsByReview] = useState<Record<string, any[]>>({})
  const [reportReviewId, setReportReviewId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("Spam")
  const [reportDetails, setReportDetails] = useState("")
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const user = useAuthStore((state) => state.user)

  const formatRelativeTime = (value?: string) => {
    if (!value) return ""
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ""
    const diffMs = date.getTime() - Date.now()
    const seconds = Math.round(diffMs / 1000)
    const absSeconds = Math.abs(seconds)
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    if (absSeconds < 60) return rtf.format(Math.round(seconds), "second")
    const minutes = Math.round(seconds / 60)
    if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute")
    const hours = Math.round(minutes / 60)
    if (Math.abs(hours) < 24) return rtf.format(hours, "hour")
    const days = Math.round(hours / 24)
    if (Math.abs(days) < 30) return rtf.format(days, "day")
    const months = Math.round(days / 30)
    if (Math.abs(months) < 12) return rtf.format(months, "month")
    const years = Math.round(months / 12)
    return rtf.format(years, "year")
  }

  useEffect(() => {
    let active = true
    async function fetchReviews() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get(`/films/${filmId}/reviews`, {
          params: { page, pageSize, sortBy },
        })
        if (!active) return
        const data = res.data as ReviewResponse
        setReviews(data.results ?? [])
        setTotalPages(data.totalPages ?? 1)
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchReviews()
    return () => {
      active = false
    }
  }, [filmId, page, pageSize, sortBy, refreshKey, listRefreshKey])

  const filteredReviews = useMemo(() => {
    if (!hideSpoilers) return reviews
    return reviews.filter((review) => !review.containsSpoilers)
  }, [reviews, hideSpoilers])

  const orderedReviews = useMemo(() => {
    if (!user?.id) return filteredReviews
    const mine = filteredReviews.filter((review) => review.userId === user.id)
    const others = filteredReviews.filter((review) => review.userId !== user.id)
    return [...mine, ...others]
  }, [filteredReviews, user?.id])

  const handleToggleLike = async (reviewId: string) => {
    try {
      await api.post(`/reviews/${reviewId}/like`)
      setListRefreshKey((prev) => prev + 1)
    } catch (err) {
      setError(normalizeApiError(err))
    }
  }

  const handleReplySubmit = async (reviewId: string) => {
    const replyText = replyTextByReview[reviewId] ?? ""
    if (!replyText.trim()) return
    try {
      await api.post(`/reviews/${reviewId}/comments`, { content: replyText.trim() })
      setReplyTextByReview((prev) => ({ ...prev, [reviewId]: "" }))
      setOpenComments((prev) => ({ ...prev, [reviewId]: true }))
      const commentsRes = await api.get(`/reviews/${reviewId}/comments`)
      setCommentsByReview((prev) => ({ ...prev, [reviewId]: commentsRes.data ?? [] }))
      setListRefreshKey((prev) => prev + 1)
    } catch (err) {
      setError(normalizeApiError(err))
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.delete(`/reviews/${reviewId}`)
      setListRefreshKey((prev) => prev + 1)
      onReviewDeleted?.(reviewId)
    } catch (err) {
      setError(normalizeApiError(err))
    }
  }

  const handleReportSubmit = async () => {
    if (!reportReviewId) return
    setReportSubmitting(true)
    try {
      await api.post(`/reviews/${reportReviewId}/report`, {
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      })
      setReportReviewId(null)
      setReportDetails("")
      setReportReason("Spam")
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setReportSubmitting(false)
    }
  }

  const handleToggleComments = async (reviewId: string) => {
    const nextOpen = !openComments[reviewId]
    setOpenComments((prev) => ({ ...prev, [reviewId]: nextOpen }))
    if (nextOpen && !commentsByReview[reviewId]) {
      try {
        const res = await api.get(`/reviews/${reviewId}/comments`)
        setCommentsByReview((prev) => ({ ...prev, [reviewId]: res.data ?? [] }))
      } catch (err) {
        setError(normalizeApiError(err))
      }
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Community reviews</h2>
          <p className="text-xs text-slate-400">
            Explore what other members thought about this film.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <span className="text-slate-400">Sort by</span>
            <select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value as typeof sortBy)
                setPage(1)
              }}
              className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-200"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            Hide spoilers
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={hideSpoilers}
                onChange={(event) => setHideSpoilers(event.target.checked)}
                className="peer sr-only"
              />
              <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-indigo-500/70" />
              <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
          </label>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-400">Loading reviews...</p>}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!loading && !error && filteredReviews.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-400">
          No reviews yet. Be the first to share your thoughts.
        </div>
      )}

      <div className="grid gap-4">
        {orderedReviews.map((review) => (
          <div key={review.id} className="space-y-3">
            {user?.id === review.userId && (
              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-200">
                Your review
              </span>
            )}
            <ReviewCard
              review={{
                id: review.id,
                user: review.user ?? { id: review.userId },
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
                containsSpoilers: review.containsSpoilers,
                rewatch: review.rewatch,
                watchedDate: review.watchedDate,
              }}
              likeCount={review._count?.likes ?? review.likes?.length ?? 0}
              commentCount={review._count?.comments ?? 0}
              liked={Boolean(review.likes?.some((like: any) => like.userId === user?.id))}
              onToggleLike={() => handleToggleLike(review.id)}
              onComment={() => handleToggleComments(review.id)}
              canDelete={user?.id === review.userId}
              onDelete={() => handleDeleteReview(review.id)}
              onReport={() => setReportReviewId(review.id)}
            />
            {openComments[review.id] && (
              <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                {(commentsByReview[review.id] ?? []).length === 0 && (
                  <p className="text-xs text-slate-400">No replies yet.</p>
                )}
                {(commentsByReview[review.id] ?? []).map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-xs text-slate-300">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-indigo-500/20 text-[10px] text-indigo-100">
                      {(comment.user?.name ?? comment.user?.email ?? "FL")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                      <p className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{comment.user?.name ?? comment.user?.email ?? "Filmly user"}</span>
                        <span>{formatRelativeTime(comment.createdAt)}</span>
                      </p>
                      <p className="text-sm text-slate-200">{comment.content}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-2 rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                  <textarea
                    rows={3}
                    value={replyTextByReview[review.id] ?? ""}
                    onChange={(event) =>
                      setReplyTextByReview((prev) => ({
                        ...prev,
                        [review.id]: event.target.value,
                      }))
                    }
                    placeholder="Write a reply..."
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                  />
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleReplySubmit(review.id)}
                      className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((prev) => ({ ...prev, [review.id]: false }))
                      }
                      className="rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:border-white/20"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {reportReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <button
            type="button"
            onClick={() => setReportReviewId(null)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur"
            aria-label="Close report modal"
          />
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Report review
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Tell us what happened</h3>
              </div>
              <button
                type="button"
                onClick={() => setReportReviewId(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-300">
              <div>
                <label className="text-sm font-semibold text-white" htmlFor="report-reason">
                  Reason
                </label>
                <select
                  id="report-reason"
                  value={reportReason}
                  onChange={(event) => setReportReason(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100"
                >
                  {[
                    "Spam",
                    "Harassment",
                    "Hate speech",
                    "Misinformation",
                    "Spoilers without warning",
                    "Off-topic",
                    "Other",
                  ].map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white" htmlFor="report-details">
                  Details (optional)
                </label>
                <textarea
                  id="report-details"
                  rows={3}
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500"
                  placeholder="Add any helpful context."
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setReportReviewId(null)}
                className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReportSubmit}
                disabled={reportSubmitting}
                className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reportSubmitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page <= 1}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-xs text-slate-400">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </section>
  )
}
