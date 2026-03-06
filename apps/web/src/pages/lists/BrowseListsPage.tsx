import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { usePageTitle } from "../../hooks/usePageTitle"
import { ChevronDown, Filter, Search, X } from "lucide-react"
import Header from "../../components/layout/Header"
import ListGrid from "../../components/lists/ListGrid"
import { fetchPopularTags, searchLists } from "../../services/listApi"
import type { List } from "../../stores/listStore"
import { useAuthStore } from "../../stores/authStore"

type Filters = {
  query: string
  privacy: Array<"PUBLIC" | "UNLISTED" | "PRIVATE">
  listType: Array<"PERSONAL" | "COLLABORATIVE" | "TEMPLATE">
  rankedOnly: boolean
  category: string
  tags: string[]
  filmCountRange: string
  filmId: string
}

function activeFilterCount(filters: Filters) {
  return (
    filters.listType.length +
    filters.privacy.length +
    (filters.rankedOnly ? 1 : 0) +
    (filters.query ? 1 : 0) +
    (filters.category !== "All" ? 1 : 0) +
    (filters.tags.length > 0 ? 1 : 0) +
    (filters.filmCountRange ? 1 : 0) +
    (filters.filmId ? 1 : 0)
  )
}

export default function BrowseListsPage() {
  usePageTitle("Browse Lists")
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const [searchParams, setSearchParams] = useSearchParams()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    query: "",
    privacy: ["PUBLIC"],
    listType: [],
    rankedOnly: false,
    category: "All",
    tags: [],
    filmCountRange: "",
    filmId: "",
  })
  const [sortBy, setSortBy] = useState<
    "trending" | "most_liked" | "newest" | "recently_updated" | "most_films" | "az"
  >("trending")
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [typeOpen, setTypeOpen] = useState(true)
  const [privacyOpen, setPrivacyOpen] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [popularTags, setPopularTags] = useState<string[]>([])
  const prevListRef = useRef<List[]>([])
  const totalRef = useRef(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    if (page === 1) {
      prevListRef.current = []
      totalRef.current = 0
    }
    searchLists({
      q: filters.query || undefined,
      privacy: filters.privacy.length ? filters.privacy : undefined,
      listType: filters.listType.length ? filters.listType : undefined,
      rankedOnly: filters.rankedOnly,
      category: filters.category !== "All" ? filters.category : undefined,
      tags: filters.tags.length ? filters.tags : undefined,
      filmCountRange: filters.filmCountRange || undefined,
      filmId: filters.filmId || undefined,
      sortBy,
      page,
      pageSize: 20,
    })
      .then((data) => {
        if (!active) return
        const incoming = Array.isArray(data) ? (data as List[]) : []
        const filtered = incoming.filter((list) => {
          if (filters.rankedOnly && !list.isRanked) return false
          if (filters.privacy.length > 0 && !filters.privacy.includes(list.privacy)) {
            return false
          }
          if (filters.listType.length > 0 && !filters.listType.includes(list.listType)) {
            return false
          }
          return true
        })
        const next = page === 1 ? filtered : [...prevListRef.current, ...filtered]
        prevListRef.current = next
        setLists(next)
        setHasMore(filtered.length === 20)
        totalRef.current = next.length
        setTotal(next.length)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message ?? "Failed to load lists.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters, sortBy, page])

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.query) params.set("q", filters.query)
    if (filters.privacy.length) params.set("privacy", filters.privacy.join(","))
    if (filters.listType.length) params.set("type", filters.listType.join(","))
    if (filters.rankedOnly) params.set("ranked", "1")
    if (filters.category && filters.category !== "All") params.set("category", filters.category)
    if (filters.tags.length) params.set("tags", filters.tags.join(","))
    if (filters.filmCountRange) params.set("count", filters.filmCountRange)
    if (filters.filmId) params.set("filmId", filters.filmId)
    if (sortBy) params.set("sort", sortBy)
    if (page > 1) params.set("page", String(page))
    setSearchParams(params, { replace: true })
  }, [filters, sortBy, page, setSearchParams])

  useEffect(() => {
    const q = searchParams.get("q") ?? ""
    const privacy = (searchParams.get("privacy") ?? "")
      .split(",")
      .filter(Boolean) as Filters["privacy"]
    const listType = (searchParams.get("type") ?? "")
      .split(",")
      .filter(Boolean) as Filters["listType"]
    const rankedOnly = searchParams.get("ranked") === "1"
    const category = searchParams.get("category") ?? "All"
    const tags = (searchParams.get("tags") ?? "").split(",").filter(Boolean)
    const count = searchParams.get("count") ?? ""
    const filmId = searchParams.get("filmId") ?? ""
    const sort =
      (searchParams.get("sort") as
        | "trending"
        | "most_liked"
        | "newest"
        | "recently_updated"
        | "most_films"
        | "az"
        | null) ?? "trending"
    const pageParam = searchParams.get("page")
    setSearchQuery(q)
    setSortBy(sort)
    setPage(pageParam ? Number(pageParam) : 1)
    setFilters({
      query: q,
      privacy: privacy.length ? privacy : ["PUBLIC"],
      listType,
      rankedOnly,
      category,
      tags,
      filmCountRange: count,
      filmId,
    })
  }, [])

  useEffect(() => {
    fetchPopularTags()
      .then((tags) => setPopularTags(tags))
      .catch(() => setPopularTags([]))
  }, [])

  useEffect(() => {
    const trimmed = searchQuery.trim()
    setSearching(Boolean(trimmed))
    const handle = window.setTimeout(() => {
      setFilters((prev) => ({ ...prev, query: trimmed }))
      setPage(1)
    }, 500)
    return () => window.clearTimeout(handle)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-['Outfit'] text-3xl font-semibold text-white">Explore Lists</h1>
              <p className="mt-1 text-sm text-white/60">
                Discover curated film lists from the community.
              </p>
            </div>
            {user && (
              <button
                type="button"
                onClick={() => navigate("/me/lists")}
                className="rounded-full border border-amber-400/50 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30"
              >
                My Lists
              </button>
            )}
          </div>
          <div className="mt-5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    const trimmed = searchQuery.trim()
                    setFilters((prev) => ({ ...prev, query: trimmed }))
                    setPage(1)
                  }
                }}
                placeholder="Search lists by title, films, or tags..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-12 text-sm text-white outline-none transition focus:border-amber-400/60 hover:border-white/20"
              />
              {searching && (
                <div className="absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-amber-300" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("")
                    setFilters((prev) => ({ ...prev, query: "" }))
                    setPage(1)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 p-1 text-white/60 transition hover:border-white/30 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="order-2 space-y-4 lg:order-1">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white transition hover:border-white/20 lg:hidden"
            >
              Filters
              <Filter className="h-4 w-4 text-white/60" />
            </button>

            <div
              className={`rounded-2xl border border-white/10 bg-white/[0.02] p-4 ${showFilters ? "block" : "hidden lg:block"
                } sticky top-24 transition`}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Filters</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                  {activeFilterCount(filters)}
                </span>
              </div>

              <div className="space-y-4 text-sm text-white/70">
                <div>
                  <button
                    type="button"
                    onClick={() => setTypeOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/70"
                  >
                    List type
                    <ChevronDown className={`h-3 w-3 transition ${typeOpen ? "rotate-180" : ""}`} />
                  </button>
                  {typeOpen && (
                    <div className="mt-2 space-y-2">
                      {[
                        { value: "PERSONAL", label: "Personal" },
                        { value: "COLLABORATIVE", label: "Collaborative" },
                        { value: "TEMPLATE", label: "Templates" },
                      ].map((type) => (
                        <label key={type.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.listType.includes(type.value as any)}
                            onChange={(event) => {
                              setFilters((prev) => {
                                const next = event.target.checked
                                  ? [...prev.listType, type.value as any]
                                  : prev.listType.filter((item) => item !== type.value)
                                return { ...prev, listType: next }
                              })
                              setPage(1)
                            }}
                            className="h-4 w-4 accent-amber-400"
                          />
                          <span>{type.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white/70"
                  >
                    Privacy
                    <ChevronDown className={`h-3 w-3 transition ${privacyOpen ? "rotate-180" : ""}`} />
                  </button>
                  {privacyOpen && (
                    <div className="mt-2 space-y-2">
                      {[
                        { value: "PUBLIC", label: "Public" },
                        { value: "UNLISTED", label: "Unlisted" },
                      ].map((option) => (
                        <label key={option.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.privacy.includes(option.value as any)}
                            onChange={(event) => {
                              setFilters((prev) => {
                                const next = event.target.checked
                                  ? [...prev.privacy, option.value as any]
                                  : prev.privacy.filter((item) => item !== option.value)
                                return { ...prev, privacy: next }
                              })
                              setPage(1)
                            }}
                            className="h-4 w-4 accent-amber-400"
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.rankedOnly}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, rankedOnly: event.target.checked }))
                      setPage(1)
                    }}
                    className="h-4 w-4 accent-amber-400"
                  />
                  Ranked lists only
                </label>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40">Category</label>
                  <select
                    value={filters.category}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, category: event.target.value }))
                      setPage(1)
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400/60 hover:border-white/20"
                  >
                    {[
                      "All",
                      "General",
                      "Decade",
                      "Genre",
                      "Director",
                      "Actor",
                      "Awards",
                      "Personal",
                      "Challenge",
                    ].map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40">Film Count</label>
                  <select
                    value={filters.filmCountRange}
                    onChange={(event) => {
                      setFilters((prev) => ({ ...prev, filmCountRange: event.target.value }))
                      setPage(1)
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400/60 hover:border-white/20"
                  >
                    <option value="">All</option>
                    <option value="1-10">1-10</option>
                    <option value="11-25">11-25</option>
                    <option value="26-50">26-50</option>
                    <option value="50+">50+</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-[0.2em] text-white/40">Tags</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {popularTags.slice(0, 20).map((tag) => {
                      const selected = filters.tags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFilters((prev) => ({
                              ...prev,
                              tags: selected
                                ? prev.tags.filter((item) => item !== tag)
                                : [...prev.tags, tag],
                            }))
                            setPage(1)
                          }}
                          className={`rounded-full border px-2 py-0.5 text-xs transition ${selected
                            ? "border-amber-400/60 bg-amber-400/20 text-amber-100"
                            : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                            }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                  {filters.tags.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilters((prev) => ({ ...prev, tags: [] }))
                        setPage(1)
                      }}
                      className="mt-3 text-xs text-amber-200/80 hover:text-amber-200"
                    >
                      Clear tags
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilters({
                      query: "",
                      privacy: ["PUBLIC"],
                      listType: [],
                      rankedOnly: false,
                      category: "All",
                      tags: [],
                      filmCountRange: "",
                      filmId: "",
                    })
                    setSearchQuery("")
                    setSortBy("newest")
                    setPage(1)
                  }}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/10"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </aside>

          <section className="order-1 lg:order-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-white/60">
                Showing {lists.length} list{lists.length === 1 ? "" : "s"}
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as typeof sortBy)
                  }
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-400/60 hover:border-white/20"
                >
                  <option value="trending">Trending</option>
                  <option value="most_liked">Most Liked</option>
                  <option value="newest">Newest</option>
                  <option value="recently_updated">Recently Updated</option>
                  <option value="most_films">Most Films</option>
                  <option value="az">A-Z</option>
                </select>
              </div>
            </div>
            {loading && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                  />
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6 text-rose-200">
                {error}
              </div>
            )}

            {!loading && !error && <ListGrid lists={lists} />}
            {!loading && !error && lists.length === 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-white/60">
                No lists match your filters yet. Try adjusting them.
              </div>
            )}

            {!loading && !error && lists.length > 0 && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <p className="text-xs text-white/50">
                  Showing {lists.length} of {total} lists
                </p>
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
