import { useEffect, useMemo, useRef, useState } from "react"
import api, { normalizeApiError } from "../../services/api"
import Header from "../../components/layout/Header"
import ActivityCard from "../../components/social/ActivityCard"
import { Activity } from "lucide-react"

type ActivityItem = {
  id: string
  type: string
  createdAt: string
  user?: { id: string; username?: string | null; name?: string | null }
  film?: { id: number; title: string; posterPath?: string | null }
  review?: { id: string; rating: number; comment?: string | null }
  metadata?: Record<string, unknown>
}

type ActivityResponse = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  results: ActivityItem[]
}

const filters = [
  { key: "all", label: "All" },
  { key: "review_created", label: "Reviews" },
  { key: "watchlist", label: "Watchlists" },
  { key: "rating", label: "Ratings" },
]

export default function ActivityFeedPage() {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [friendsOnly, setFriendsOnly] = useState(false)
  const loaderRef = useRef<HTMLDivElement | null>(null)

  const canLoadMore = page < totalPages

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, pageSize: 10 }
    if (filter !== "all") params.type = filter
    if (friendsOnly) params.friends = "true"
    return params
  }, [page, filter, friendsOnly])

  const fetchPage = async (nextPage: number, reset = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get<ActivityResponse>("/activity", {
        params: { ...queryParams, page: nextPage },
      })
      const data = res.data
      setTotalPages(data.totalPages)
      setItems((prev) => (reset ? data.results : [...prev, ...data.results]))
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setItems([])
    setPage(1)
    setTotalPages(1)
    void fetchPage(1, true)
  }, [filter, friendsOnly])

  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && canLoadMore && !loading) {
          const next = page + 1
          setPage(next)
          void fetchPage(next)
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [loaderRef, canLoadMore, loading, page])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Outfit'] text-3xl font-bold text-white">Activity</h1>
            <p className="mt-2 text-sm text-white/50">What's happening in your circle</p>
          </div>
          <button
            type="button"
            onClick={() => setFriendsOnly((prev) => !prev)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${friendsOnly
                ? "bg-amber-400/10 text-amber-400"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
          >
            {friendsOnly ? "Friends only" : "Everyone"}
          </button>
        </div>

        {/* Filters */}
        <div className="mb-8 flex gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${filter === item.key
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          {items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <svg className="h-5 w-5 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                <Activity className="h-8 w-8 text-white/30" />
              </div>
              <h3 className="font-['Outfit'] text-lg font-semibold text-white">No activity yet</h3>
              <p className="mt-1 text-sm text-white/50">Start following people to see activity</p>
            </div>
          )}
        </div>

        <div ref={loaderRef} className="h-12" />
      </main>
    </div>
  )
}
