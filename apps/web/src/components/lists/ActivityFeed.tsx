import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getListActivities } from "../../services/listApi"

type ActivityItem = {
  id: string
  userId: string
  activityType: string
  createdAt: string
  film?: { id: number; title: string; posterPath?: string | null }
  user?: { id: string; username?: string | null; name?: string | null; avatarUrl?: string | null }
  metadata?: Record<string, any> | null
}

type ActivityFeedProps = {
  listId: string
}

type GroupedActivity = {
  id: string
  user: ActivityItem["user"]
  createdAt: string
  type: "add_group" | "single"
  items: ActivityItem[]
}

function formatActivity(item: ActivityItem) {
  const name = item.user?.username ?? "Someone"
  switch (item.activityType) {
    case "FILM_ADDED":
      return `${name} added ${item.film?.title ?? "a film"}`
    case "FILM_REMOVED":
      return `${name} removed ${item.film?.title ?? "a film"}`
    case "FILM_REORDERED":
      return `${name} reordered the list`
    case "TITLE_UPDATED":
      return `${name} updated the title`
    case "DESCRIPTION_UPDATED":
      return `${name} updated the description`
    case "CONTRIBUTOR_ADDED":
      return `${name} added a contributor`
    case "CONTRIBUTOR_REMOVED":
      return `${name} removed a contributor`
    case "LIST_PUBLISHED":
      return `${name} published the list`
    default:
      return `${name} updated the list`
  }
}

function groupActivities(items: ActivityItem[]) {
  const groups: GroupedActivity[] = []
  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  for (const item of sorted) {
    const last = groups[groups.length - 1]
    const itemTime = new Date(item.createdAt).getTime()
    const lastTime = last ? new Date(last.createdAt).getTime() : 0
    const withinFiveMinutes = Math.abs(itemTime - lastTime) <= 5 * 60 * 1000

    if (
      last &&
      last.type === "add_group" &&
      item.activityType === "FILM_ADDED" &&
      last.user?.id === item.user?.id &&
      withinFiveMinutes
    ) {
      last.items.push(item)
    } else if (item.activityType === "FILM_ADDED") {
      groups.push({
        id: item.id,
        user: item.user,
        createdAt: item.createdAt,
        type: "add_group",
        items: [item],
      })
    } else {
      groups.push({
        id: item.id,
        user: item.user,
        createdAt: item.createdAt,
        type: "single",
        items: [item],
      })
    }
  }

  return groups
}

export default function ActivityFeed({ listId }: ActivityFeedProps) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getListActivities(listId, 1, 10)
      .then((data) => {
        if (!active) return
        setItems(data?.activities ?? [])
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message ?? "Failed to load activity.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [listId])

  const grouped = useMemo(() => groupActivities(items), [items])

  const renderList = (activityGroups: GroupedActivity[]) => (
    <div className="space-y-3">
      {activityGroups.map((group) => {
        const displayName = group.user?.username ?? "Someone"
        const timeAgo = formatDistanceToNow(new Date(group.createdAt), { addSuffix: true })

        if (group.type === "add_group" && group.items.length > 1) {
          return (
            <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/80">
                  <span className="font-semibold text-white">{displayName}</span> added{" "}
                  {group.items.length} films
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroup(expandedGroup === group.id ? null : group.id)
                  }
                  className="text-xs text-amber-200/80 hover:text-amber-200"
                >
                  {expandedGroup === group.id ? "Hide" : "View"}
                </button>
              </div>
              <p className="mt-1 text-xs text-white/40">{timeAgo}</p>
              {expandedGroup === group.id && (
                <ul className="mt-3 space-y-1 text-xs text-white/70">
                  {group.items.map((item) => (
                    <li key={item.id}>
                      {item.film ? (
                        <Link to={`/films/${item.film.id}`} className="hover:text-amber-200">
                          {item.film.title}
                        </Link>
                      ) : (
                        "Film"
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        }

        const item = group.items[0]
        return (
          <div key={group.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-sm text-white/80">{formatActivity(item)}</p>
            <p className="mt-1 text-xs text-white/40">{timeAgo}</p>
            {item.film && (
              <Link to={`/films/${item.film.id}`} className="mt-2 inline-block text-xs text-amber-200/80 hover:text-amber-200">
                View film
              </Link>
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-['Outfit'] text-lg font-semibold text-white">Activity</h3>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-xs text-amber-200/80 hover:text-amber-200"
        >
          View all activity
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      )}
      {!loading && error && (
        <p className="text-sm text-rose-200">CouldnÃ¢â‚¬â„¢t load activity. Try again later.</p>
      )}
      {!loading && !error && grouped.length === 0 && (
        <p className="text-sm text-white/50">No recent activity yet.</p>
      )}
      {!loading && !error && grouped.length > 0 && renderList(grouped)}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-['Outfit'] text-lg font-semibold text-white">All activity</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {renderList(grouped)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

