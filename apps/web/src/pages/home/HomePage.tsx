import { useEffect, useMemo, useRef, useState } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import Header from "../../components/layout/Header"
import FilmCard from "../../components/film/FilmCard"
import HeroSpotlight from "../../components/home/HeroSpotlight"
import { getTrendingFilms } from "../../services/filmService"
import { useAuthStore } from "../../stores/authStore"
import api from "../../services/api"
import AchievementCard from "../../components/home/AchievementCard"
import WatchlistCard from "../../components/home/WatchlistCard"
import AchievementModal from "../../components/home/AchievementModal"
import AchievementEmptyState from "../../components/home/AchievementEmptyState"
import {
  WATCHED_TIERS,
  REVIEW_TIERS,
  calculateWatchedLevel,
  calculateReviewLevel,
} from "../../constants/achievements"

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
  usePageTitle()
  const user = useAuthStore((state) => state.user)
  const [spotlightFilms, setSpotlightFilms] = useState<Film[]>([])
  const [trending, setTrending] = useState<Film[]>([])
  const [todayPicks, setTodayPicks] = useState<Film[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [stats, setStats] = useState({ watched: 0, watchlist: 0, reviews: 0 })
  const [trendingPage, setTrendingPage] = useState(1)
  const [trendingTotalPages, setTrendingTotalPages] = useState(1)
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [moreVisibleCount, setMoreVisibleCount] = useState(4)
  const lastStatsFetchRef = useRef<{ userId: string; at: number } | null>(null)
  const [achievementModal, setAchievementModal] = useState<"watched" | "reviews" | null>(null)

  const watchedProgress = useMemo(() => calculateWatchedLevel(stats.watched), [stats.watched])
  const reviewProgress = useMemo(() => calculateReviewLevel(stats.reviews), [stats.reviews])

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

        const mapFilm = (item: any) => ({
          id: item.id,
          title: item.title,
          releaseDate: item.release_date ?? null,
          posterPath: item.poster_path ?? null,
          backdropPath: item.backdrop_path ?? null,
          rating: item.vote_average ?? null,
          overview: item.overview ?? null,
        })

        const trendingData = trendingResult.status === "fulfilled" ? trendingResult.value : null
        const todayData = todayResult.status === "fulfilled" ? todayResult.value : null

        const todayCandidates = (todayData?.results ?? [])
          .filter((item: any) => Boolean(item.poster_path))
          .map(mapFilm)

        const trendingCandidates = (trendingData?.results ?? [])
          .filter((item: any) => Boolean(item.poster_path))
          .map(mapFilm)

        const todaySelection: Film[] = []
        const usedIds = new Set<number>()

        todayCandidates.forEach((film: Film) => {
          if (todaySelection.length >= 4) return
          if (usedIds.has(film.id)) return
          usedIds.add(film.id)
          todaySelection.push(film)
        })

        if (todaySelection.length < 4) {
          trendingCandidates.forEach((film: Film) => {
            if (todaySelection.length >= 4) return
            if (usedIds.has(film.id)) return
            usedIds.add(film.id)
            todaySelection.push(film)
          })
        }

        if (todayResult.status === "rejected") {
          console.error("Failed to load today's picks:", todayResult.reason)
        }
        setTodayPicks(todaySelection)

        if (trendingResult.status === "fulfilled") {
          const trendingResults = trendingCandidates
            .filter((film: Film) => !usedIds.has(film.id))
            .slice(0, 12)

          setTrending(trendingResults)
          setSpotlightFilms(trendingResults.slice(0, 7))
          setTrendingPage(1)
          setTrendingTotalPages(trendingData?.total_pages ?? 1)
        } else {
          console.error("Failed to load trending films:", trendingResult.reason)
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

      const commitStats = (nextStats: { watched: number; watchlist: number; reviews: number }) => {
        if (!active) return
        setStats(nextStats)
        lastStatsFetchRef.current = { userId, at: Date.now() }
      }

      const username = user?.username

      try {
        const statsRes = await api.get("/users/me/stats")
        commitStats({
          watched: Number(statsRes.data?.watchedCount ?? 0),
          watchlist: Number(statsRes.data?.watchlistItemCount ?? 0),
          reviews: Number(statsRes.data?.reviewCount ?? 0),
        })
        return
      } catch {
        // fall back to username or legacy endpoints
      }

      if (username) {
        try {
          const statsRes = await api.get(`/users/${username}/stats`)
          commitStats({
            watched: Number(statsRes.data?.watchedCount ?? 0),
            watchlist: Number(statsRes.data?.watchlistItemCount ?? 0),
            reviews: Number(statsRes.data?.reviewCount ?? 0),
          })
          return
        } catch {
          // fall back to legacy endpoints below
        }
      }

      try {
        const [watchlistRes, reviewsRes, watchedRes] = await Promise.all([
          api.get("/watchlist/default").catch(() => ({ data: { items: [] } })),
          api.get("/reviews/me").catch(() => ({ data: [] })),
          username
            ? api.get(`/users/${username}/watched`).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
        ])
        commitStats({
          watched: Array.isArray(watchedRes.data) ? watchedRes.data.length : 0,
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

  const todaySlots = 4
  const todayPicksForDisplay = useMemo(() => todayPicks.slice(0, todaySlots), [todayPicks])
  const todayIds = useMemo(
    () => new Set(todayPicksForDisplay.map((film: Film) => film.id)),
    [todayPicksForDisplay]
  )
  const moreToExplore = useMemo(
    () => trending.slice(9).filter((film: Film) => !todayIds.has(film.id)),
    [trending, todayIds]
  )
  const canLoadMoreTrending = trendingPage < trendingTotalPages

  const handleLoadMoreTrending = async (targetCount = moreVisibleCount + 8) => {
    if (trendingLoading || !canLoadMoreTrending) return
    setTrendingLoading(true)
    try {
      let nextPage = trendingPage
      let totalPages = trendingTotalPages
      let updatedTrending = [...trending]
      const existingIds = new Set([
        ...updatedTrending.map((film) => film.id),
        ...todayPicks.map((film) => film.id),
      ])

      const computeMoreCount = (items: Film[]) =>
        items.slice(9).filter((film: Film) => !todayIds.has(film.id)).length

      let safety = 0
      while (nextPage < totalPages && safety < 5) {
        nextPage += 1
        const res = await getTrendingFilms("week", nextPage)
        totalPages = res?.total_pages ?? totalPages
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

        nextItems.forEach((film: Film) => existingIds.add(film.id))
        updatedTrending = [...updatedTrending, ...nextItems]

        const moreCount = computeMoreCount(updatedTrending)
        if (moreCount >= targetCount) {
          break
        }
        safety += 1
      }

      setTrending(updatedTrending)
      setTrendingPage(nextPage)
      setTrendingTotalPages(totalPages)
      setMoreVisibleCount(Math.min(targetCount, computeMoreCount(updatedTrending)))
    } catch (error) {
      console.error("Failed to load more trending films:", error)
    } finally {
      setTrendingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 animate-fade-in sm:px-6 sm:py-12">
        {/* Featured + Stats Grid */}
        <section className="mb-16">
          <div className="grid gap-4 md:grid-cols-3 md:items-stretch">
            {spotlightFilms.length > 0 && (
              <div className="group relative h-full min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-[rgb(18,18,24)] sm:min-h-[420px] md:col-span-2 md:min-h-[520px]">
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
                  contentAlign={user ? "end" : "center"}
                />
              </div>
            )}

            {user && (
              <div className="h-full rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-5">
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                  {stats.watched === 0 && stats.reviews === 0 && stats.watchlist === 0
                    ? "Your Achievement Journey"
                    : "Your Achievements"}
                </h3>

                {stats.watched === 0 && stats.reviews === 0 && stats.watchlist === 0 ? (
                  <AchievementEmptyState />
                ) : (
                  <div className="achievement-scroll-container">
                    <AchievementCard
                      kind="watched"
                      progress={watchedProgress}
                      tiers={WATCHED_TIERS}
                      step={50}
                      onOpenModal={() => setAchievementModal("watched")}
                    />
                    <AchievementCard
                      kind="reviews"
                      progress={reviewProgress}
                      tiers={REVIEW_TIERS}
                      step={20}
                      onOpenModal={() => setAchievementModal("reviews")}
                    />
                    <WatchlistCard count={stats.watchlist} />
                  </div>
                )}
              </div>
            )}

            {achievementModal && (
              <AchievementModal
                kind={achievementModal}
                progress={achievementModal === "watched" ? watchedProgress : reviewProgress}
                tiers={achievementModal === "watched" ? WATCHED_TIERS : REVIEW_TIERS}
                onClose={() => setAchievementModal(null)}
              />
            )}

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

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sectionsLoading
              ? Array.from({ length: todaySlots }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
              ))
              : Array.from({ length: todaySlots }).map((_, i) => {
                const film = todayPicksForDisplay[i]
                if (!film) {
                  return (
                    <div
                      key={`today-slot-${i}`}
                      className="aspect-[2/3] rounded-2xl border border-white/10 bg-white/[0.04]"
                    />
                  )
                }
                return (
                  <div
                    key={film.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${i * 0.14}s` }}
                  >
                    <FilmCard
                      id={film.id}
                      title={film.title}
                      releaseDate={film.releaseDate}
                      posterPath={film.posterPath}
                      rating={film.rating}
                    />
                  </div>
                )
              })}
          </div>
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
              {trending.slice(1, 9).map((film, index) => (
                <div
                  key={film.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.14}s` }}
                >
                  <FilmCard
                    id={film.id}
                    title={film.title}
                    releaseDate={film.releaseDate}
                    posterPath={film.posterPath}
                    rating={film.rating}
                  />
                </div>
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
              {moreToExplore.slice(0, moreVisibleCount).map((film: Film, index) => (
                <div
                  key={film.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.14}s` }}
                >
                  <FilmCard
                    id={film.id}
                    title={film.title}
                    releaseDate={film.releaseDate}
                    posterPath={film.posterPath}
                    rating={film.rating}
                  />
                </div>
              ))}
            </div>
            {(moreToExplore.length > moreVisibleCount || canLoadMoreTrending) && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const nextTarget = moreVisibleCount + 8
                    if (moreToExplore.length >= nextTarget || !canLoadMoreTrending) {
                      setMoreVisibleCount(Math.min(nextTarget, moreToExplore.length))
                      return
                    }
                    void handleLoadMoreTrending(nextTarget)
                  }}
                  disabled={trendingLoading}
                  className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.05] hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
