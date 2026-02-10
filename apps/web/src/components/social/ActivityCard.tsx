import { useState } from "react"
import { Link } from "react-router-dom"
import CommentSection from "./CommentSection"

type ActivityUser = {
  username?: string | null
  name?: string | null
  avatarUrl?: string | null
}

type ActivityFilm = {
  id: number
  title: string
  posterPath?: string | null
}

type ActivityItem = {
  id: string
  type: string
  createdAt: string
  user?: ActivityUser | null
  film?: ActivityFilm | null
  metadata?: Record<string, unknown>
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

function getTitle(activity: ActivityItem) {
  const name = activity.user?.name ?? activity.user?.username ?? "Someone"
  const filmTitle = activity.film?.title ?? "a film"

  switch (activity.type) {
    case "review_created":
      return `${name} reviewed ${filmTitle}`
    case "review_updated":
      return `${name} updated a review for ${filmTitle}`
    case "watchlist_add":
      return `${name} added ${filmTitle} to watchlist`
    case "follow":
      return `${name} followed someone`
    case "list_created":
      return `${name} created a list`
    default:
      return `${name} activity`
  }
}

export default function ActivityCard({ activity }: { activity: ActivityItem }) {
  const [commentsOpen, setCommentsOpen] = useState(
    ["review_created", "review_updated", "watchlist_add"].includes(activity.type)
  )
  const timeAgo = formatTimeAgo(activity.createdAt)
  const userLabel = activity.user?.username ?? activity.user?.name ?? "user"
  const profileLink = activity.user?.username ? `/users/${activity.user.username}` : "#"
  const filmLink = activity.film?.id ? `/films/${activity.film.id}` : "#"

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
          {activity.user?.avatarUrl ? (
            <img
              src={activity.user.avatarUrl}
              alt={userLabel}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
              {(userLabel[0] ?? "U").toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-base text-slate-200">{getTitle(activity)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {activity.user?.username && (
              <Link to={profileLink} className="hover:text-slate-200">
                @{activity.user.username}
              </Link>
            )}
            <span>{timeAgo}</span>
          </div>
        </div>

        {activity.film?.posterPath && (
          <Link to={filmLink} className="h-16 w-11 overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
            <img
              src={`https://image.tmdb.org/t/p/w185${activity.film.posterPath}`}
              alt={activity.film.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </Link>
        )}
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          className="text-sm font-semibold text-indigo-200 transition hover:text-indigo-100"
        >
          {commentsOpen ? "Hide comments" : "Show comments"}
        </button>
      </div>

      {commentsOpen && (
        <div className="mt-4">
          <CommentSection activityId={activity.id} />
        </div>
      )}
    </div>
  )
}
