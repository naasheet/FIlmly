import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Header from "../../components/layout/Header"
import FilmCard from "../../components/film/FilmCard"
import HeroSpotlight from "../../components/home/HeroSpotlight"
import { getTrendingFilms } from "../../services/filmService"
import { useAuthStore } from "../../stores/authStore"
import { Star, Bookmark, Eye } from "lucide-react"
import api from "../../services/api"

type Film = {
  id: number
  title: string
  releaseDate?: string | null
  posterPath?: string | null
  backdropPath?: string | null
  rating?: number | null
  overview?: string | null
}

export default function HomePage() {
  const user = useAuthStore((state) => state.user)
  const [spotlightFilms, setSpotlightFilms] = useState<Film[]>([])
  const [trending, setTrending] = useState<Film[]>([])
  const [todayPicks, setTodayPicks] = useState<Film[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [stats, setStats] = useState({ watched: 0, watchlist: 0, reviews: 0 })
  const [trendingPage, setTrendingPage] = useState(1)
  const [trendingTotalPages, setTrendingTotalPages] = useState(1)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const lastStatsFetchRef = useRef<{ userId: string; at: number } | null>(null)

  useEffect(() => {
    let active = true

    async function loadTrendingAndToday() {
      setSectionsLoading(true)
      try {
        const [trendingResult, todayResult] = await Promise.allSettled([
          getTrendingFilms("week", 1),
          getTrendingFilms("day", 1),
        ])
        if (!active) return

        const seenIds = new Set<number>()

        if (trendingResult.status === "fulfilled") {
          const trendingData = trendingResult.value
          const trendingResults = (trendingData?.results ?? [])
            .filter((item: any) => Boolean(item.poster_path))
            .filter((item: any) => {
              if (seenIds.has(item.id)) return false
              seenIds.add(item.id)
              return true
            })
            .slice(0, 12)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              releaseDate: item.release_date ?? null,
              posterPath: item.poster_path ?? null,
              backdropPath: item.backdrop_path ?? null,
              rating: item.vote_average ?? null,
              overview: item.overview ?? null,
            }))

          setTrending(trendingResults)
          setSpotlightFilms(trendingResults.slice(0, 7))
          setTrendingPage(1)
          setTrendingTotalPages(trendingData?.total_pages ?? 1)
        } else {
          console.error("Failed to load trending films:", trendingResult.reason)
        }

        if (todayResult.status === "fulfilled") {
          const todayData = todayResult.value
          const todayResults = (todayData?.results ?? [])
            .filter((item: any) => Boolean(item.poster_path) && !seenIds.has(item.id))
            .filter((item: any) => {
              if (seenIds.has(item.id)) return false
              seenIds.add(item.id)
              return true
            })
            .slice(0, 8)
            .map((item: any) => ({
              id: item.id,
              title: item.title,
              releaseDate: item.release_date ?? null,
              posterPath: item.poster_path ?? null,
              rating: item.vote_average ?? null,
            }))

          setTodayPicks(todayResults)
        } else {
          console.error("Failed to load today's picks:", todayResult.reason)
        }
      } catch (error) {
        console.error("Failed to load homepage:", error)
      } finally {
        if (active) setSectionsLoading(false)
      }
    }

    loadTrendingAndToday()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadStats() {
      const userId = user?.id
      if (!userId) {
        if (active) {
          setStats({ watched: 0, watchlist: 0, reviews: 0 })
        }
        return
      }

      const now = Date.now()
      if (
        lastStatsFetchRef.current &&
        lastStatsFetchRef.current.userId === userId &&
        now - lastStatsFetchRef.current.at < 60_000
      ) {
        return
      }
      lastStatsFetchRef.current = { userId, at: now }

      try {
        const [watchlistRes, reviewsRes] = await Promise.all([
          api.get("/watchlist/default").catch(() => ({ data: { items: [] } })),
          api.get("/reviews/me").catch(() => ({ data: [] })),
        ])
        if (!active) return
        setStats({
          watched: 0,
          watchlist: watchlistRes.data?.items?.length ?? 0,
          reviews: reviewsRes.data?.length ?? 0,
        })
      } catch {
        // best-effort only
      }
    }

    loadStats()
    return () => { active = false }
  }, [user?.id])

  const todayIds = useMemo(() => new Set(todayPicks.map((film) => film.id)), [todayPicks])
  const canLoadMoreTrending = trendingPage < trendingTotalPages

  const handleLoadMoreTrending = async () => {
    if (trendingLoading || !canLoadMoreTrending) return
    setTrendingLoading(true)
    try {
      const nextPage = trendingPage + 1
      const res = await getTrendingFilms("week", nextPage)
      const existingIds = new Set([
        ...trending.map((film) => film.id),
        ...todayPicks.map((film) => film.id),
      ])
      const nextItems = (res?.results ?? [])
        .filter((item: any) => Boolean(item.poster_path))
        .filter((item: any) => !existingIds.has(item.id))
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          releaseDate: item.release_date ?? null,
          posterPath: item.poster_path ?? null,
          backdropPath: item.backdrop_path ?? null,
          rating: item.vote_average ?? null,
          overview: item.overview ?? null,
        }))

      setTrending((prev) => [...prev, ...nextItems])
      setTrendingPage(nextPage)
      setTrendingTotalPages(res?.total_pages ?? trendingTotalPages)
    } catch (error) {
      console.error("Failed to load more trending films:", error)
    } finally {
      setTrendingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Featured + Stats Grid */}
        <section className="mb-16">
          <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
            {spotlightFilms.length > 0 && (
              <div className="group relative row-span-2 overflow-hidden rounded-3xl border border-white/10 bg-[rgb(18,18,24)] md:col-span-2">
                <HeroSpotlight
                  films={spotlightFilms.map((film) => ({
                    id: film.id,
                    title: film.title,
                    overview: film.overview,
                    backdropPath: film.backdropPath,
                    posterPath: film.posterPath,
                    releaseDate: film.releaseDate,
                    rating: film.rating,
                  }))}
                />
              </div>
            )}

            {user && (
              <div className="rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <Eye className="h-4 w-4" />
                      Watched
                    </span>
                    <span className="font-['Outfit'] text-2xl font-bold text-white">{stats.watched}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <Bookmark className="h-4 w-4" />
                      Watchlist
                    </span>
                    <span className="font-['Outfit'] text-2xl font-bold text-white">{stats.watchlist}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                      <Star className="h-4 w-4" />
                      Reviews
                    </span>
                    <span className="font-['Outfit'] text-2xl font-bold text-white">{stats.reviews}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">Quick Access</h3>
              <div className="space-y-2">
                <Link
                  to="/watchlist"
                  onClick={(event) => {
                    if (!user) {
                      event.preventDefault()
                      const next = encodeURIComponent(
                        `${window.location.pathname}${window.location.search}`,
                      )
                      window.location.href = `/login?next=${next}`
                    }
                  }}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <span>Your Watchlist</span>
                  <span className="text-white/50">→</span>
                </Link>
                <Link
                  to="/reviews"
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <span>Your Reviews</span>
                  <span className="text-white/50">→</span>
                </Link>
                <Link
                  to="/activity"
                  onClick={(event) => {
                    if (!user) {
                      event.preventDefault()
                      const next = encodeURIComponent(
                        `${window.location.pathname}${window.location.search}`,
                      )
                      window.location.href = `/login?next=${next}`
                    }
                  }}
                  className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <span>Activity Feed</span>
                  <span className="text-white/50">→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

{/* Today's Picks - Vertical Grid */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] text-2xl font-bold text-white">Today's Picks</h2>
              <p className="text-sm text-white/50">Hand-picked for you</p>
            </div>
          </div>

          {sectionsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {todayPicks.map((film) => (
                <FilmCard
                  key={film.id}
                  id={film.id}
                  title={film.title}
                  releaseDate={film.releaseDate}
                  posterPath={film.posterPath}
                  rating={film.rating}
                />
              ))}
            </div>
          )}
        </section>

        {/* Trending - Masonry-style Vertical Grid */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] text-2xl font-bold text-white">Trending This Week</h2>
              <p className="text-sm text-white/50">What everyone's watching</p>
            </div>
          </div>

          {sectionsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {trending.slice(1, 9).map((film) => (
                <FilmCard
                  key={film.id}
                  id={film.id}
                  title={film.title}
                  releaseDate={film.releaseDate}
                  posterPath={film.posterPath}
                  rating={film.rating}
                />
              ))}
            </div>
          )}
        </section>

        {/* More Films - Simple Grid */}
        {trending.length > 9 && (
          <section>
            <div className="mb-6">
              <h2 className="font-['Outfit'] text-2xl font-bold text-white">More to Explore</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {trending
                .slice(9)
                .filter((film) => !todayIds.has(film.id))
                .map((film) => (
                <FilmCard
                  key={film.id}
                  id={film.id}
                  title={film.title}
                  releaseDate={film.releaseDate}
                  posterPath={film.posterPath}
                  rating={film.rating}
                />
              ))}
            </div>
            {canLoadMoreTrending && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMoreTrending}
                  disabled={trendingLoading}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {trendingLoading ? "Loading..." : "Show more films"}
                </button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
