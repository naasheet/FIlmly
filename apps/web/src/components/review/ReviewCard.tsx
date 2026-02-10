import { useEffect, useRef, useState } from "react"
import { Heart } from "lucide-react"
import { Link } from "react-router-dom"
import RatingStars from "../ui/RatingStars"

type ReviewUser = {
  id: string
  name?: string | null
  email?: string | null
  username?: string | null
  avatarUrl?: string | null
}

type ReviewCardProps = {
  review: {
    id: string
    user: ReviewUser
    rating: number
    comment?: string | null
    createdAt?: string
    containsSpoilers?: boolean
    watchedDate?: string | null
    rewatch?: boolean
  }
  likeCount?: number
  commentCount?: number
  liked?: boolean
  onToggleLike?: (reviewId: string) => void
  onComment?: (reviewId: string) => void
  canDelete?: boolean
  onDelete?: (reviewId: string) => void
  onReport?: (reviewId: string) => void
}

function getInitials(user: ReviewUser) {
  const source = user.name?.trim() || user.email?.trim() || "FL"
  const parts = source.split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatDate(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString()
}

function formatRelativeTime(value?: string) {
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

function formatRelativeOrDate(value?: string) {
  return formatRelativeTime(value) || formatDate(value)
}

export default function ReviewCard({
  review,
  likeCount = 0,
  commentCount = 0,
  liked = false,
  onToggleLike,
  onComment,
  canDelete = false,
  onDelete,
  onReport,
}: ReviewCardProps) {
  const [showSpoilers, setShowSpoilers] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const displayName = review.user.name ?? review.user.email ?? "Filmly user"
  const profileLink = review.user.username
    ? `/users/${review.user.username}`
    : null
  const publishedAt = formatRelativeOrDate(review.createdAt)
  const watchedAt = review.watchedDate ? formatRelativeOrDate(review.watchedDate) : ""
  const rewatchLabel = review.rewatch ? "Rewatch" : null

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-indigo-500/20 text-xs font-semibold text-indigo-100">
            {review.user.avatarUrl ? (
              <img
                src={review.user.avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(review.user)
            )}
          </div>
          <div>
            {profileLink ? (
              <Link
                to={profileLink}
                className="text-sm font-semibold text-white transition hover:text-amber-300"
              >
                {displayName}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-white">{displayName}</p>
            )}
            <p className="text-xs text-slate-400">
              {publishedAt}
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-2" ref={menuRef}>
          {watchedAt && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-slate-200">
              Watched {watchedAt}
            </span>
          )}
          {rewatchLabel && (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
              Rewatch
            </span>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:border-white/20"
            aria-label="Review options"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-2 min-w-[160px] rounded-2xl border border-white/10 bg-slate-950 p-2 text-xs text-slate-200 shadow-2xl">
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete?.(review.id)
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-rose-200 transition hover:bg-rose-500/10"
                >
                  Delete review
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onReport?.(review.id)
                  }}
                  className="w-full rounded-xl px-3 py-2 text-left text-amber-200 transition hover:bg-amber-500/10"
                >
                  Report review
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex items-center gap-2">
        <RatingStars value={review.rating} readOnly step={0.5} size="sm" label="Review rating" />
      </div>

      <div className="space-y-2">
        {review.containsSpoilers && !showSpoilers && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
            Spoilers hidden.{" "}
            <button
              type="button"
              onClick={() => setShowSpoilers(true)}
              className="font-semibold text-amber-100 underline underline-offset-2"
            >
              Reveal
            </button>
          </div>
        )}
        <p
          className={`text-sm text-slate-300 ${
            review.containsSpoilers && !showSpoilers ? "blur-sm select-none" : ""
          }`}
        >
          {review.comment ?? "No review text provided."}
        </p>
      </div>

      <footer className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onToggleLike?.(review.id)}
            aria-label={liked ? "Unlike review" : "Like review"}
            className={`flex items-center gap-2 rounded-full border px-3 py-1 transition ${
              liked
                ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
            }`}
          >
            <Heart
              className={`h-4 w-4 ${liked ? "fill-rose-400 text-rose-300" : "text-slate-300"}`}
            />
            <span className="text-xs">{likeCount}</span>
          </button>
        <button
          type="button"
          onClick={() => onComment?.(review.id)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 transition hover:border-white/20"
        >
          Comment ({commentCount})
        </button>
        {review.containsSpoilers && (
          <button
            type="button"
            onClick={() => setShowSpoilers((prev) => !prev)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-300 transition hover:border-white/20"
          >
            {showSpoilers ? "Hide spoilers" : "Show spoilers"}
          </button>
        )}
      </footer>
    </article>
  )
}
