import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useLocation } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  Clock,
  Calendar,
  Plus,
  Check,
  Eye,
  EyeOff
} from "lucide-react"
import Header from "../../components/layout/Header"
import FilmCard from "../../components/film/FilmCard"
import RatingStars from "../../components/ui/RatingStars"
import ReviewForm from "../../components/review/ReviewForm"
import ReviewList from "../../components/review/ReviewList"
import api, { normalizeApiError } from "../../services/api"
import { getFilmDetails, getFilmLists, getWatchedStatus, toggleWatched } from "../../services/filmService"
import { useAuthStore } from "../../stores/authStore"
import { resolvePosterUrl } from "../../utils/image"
import ChatContainer from "@/components/chat/ChatContainer"
import { useChatStore } from "@/stores/chatStore"
import { bulkAddFilmToLists, getMyLists } from "../../services/listApi"
import CreateListModal from "../../components/lists/CreateListModal"

type FilmDetails = {
  film: {
    id: number
    title: string
    originalTitle?: string | null
    overview?: string | null
    posterPath?: string | null
    backdropPath?: string | null
    backdrops?: string[] | null
    logos?: string[] | null
    releaseDate?: string | null
    runtime?: number | null
    genres?: string[] | null
    director?: string | null
    cast?: string[] | null
    tmdbRating?: number | null
    tagline?: string | null
  }
  credits?: {
    cast: { id: number; name: string; character?: string | null; profile_path?: string | null }[]
    crew: { id: number; name: string; job?: string | null; department?: string | null }[]
  } | null
  stats?: {
    reviewCount: number
    averageRating: number | null
  }
}

type Rating = {
  id: string
  rating: number
}

type Review = {
  id: string
  userId: string
  rating: number
}

function formatYear(releaseDate?: string | null) {
  if (!releaseDate) return null
  const date = new Date(releaseDate)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

function formatRuntime(runtime?: number | null) {
  if (!runtime) return null
  const hours = Math.floor(runtime / 60)
  const minutes = runtime % 60
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
}

export default function FilmPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const onlineUsers = useChatStore((state) => state.onlineUsers)
  const uniqueOnlineCount = useMemo(() => new Set(onlineUsers.map((entry) => entry.user_id)).size, [onlineUsers])
  const displayOnlineCount = Math.max(1, uniqueOnlineCount)
  const [details, setDetails] = useState<FilmDetails | null>(null)
  const [rating, setRating] = useState<Rating | null>(null)
  const [userReview, setUserReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [pendingRating, setPendingRating] = useState<number | null>(null)
  const [watchlistBusy, setWatchlistBusy] = useState(false)
  const [inWatchlist, setInWatchlist] = useState<boolean | null>(null)
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0)
  const [watched, setWatched] = useState(false)
  const [watchedBusy, setWatchedBusy] = useState(false)
  const [similarFilms, setSimilarFilms] = useState<any[]>([])
  const [similarPage, setSimilarPage] = useState(1)
  const [similarHasMore, setSimilarHasMore] = useState(true)
  const [similarLoading, setSimilarLoading] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [oscars, setOscars] = useState<Array<{ category: string; year: string; won: boolean; nominee_name: string }>>([])
  const [oscarsOpen, setOscarsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [appearsInLists, setAppearsInLists] = useState<any[]>([])
  const [appearsTotal, setAppearsTotal] = useState(0)
  const [listsLoading, setListsLoading] = useState(false)
  const [addToListOpen, setAddToListOpen] = useState(false)
  const [myLists, setMyLists] = useState<any[]>([])
  const [myListsLoading, setMyListsLoading] = useState(false)
  const [listSelection, setListSelection] = useState<Set<string>>(new Set())
  const [addListBusy, setAddListBusy] = useState(false)
  const [addListError, setAddListError] = useState<string | null>(null)
  const [createListOpen, setCreateListOpen] = useState(false)

  const filmId = useMemo(() => Number(id), [id])
  const location = useLocation()

  useEffect(() => {
    let active = true
    async function fetchData() {
      if (!filmId || Number.isNaN(filmId)) {
        setError("Invalid film id")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setDetails(null)
      try {
        const filmRes = await getFilmDetails(filmId)
        if (!active) return
        setDetails(filmRes as FilmDetails)

        setSimilarLoading(true)
        const similarRes = await api.get(`/films/${filmId}/similar`, { params: { page: 1 } })
        if (!active) return
        const similar = (similarRes.data?.results ?? [])
          .filter((item: any) => item.id !== filmId && Boolean(item.poster_path))
          .map((item: any) => ({
            id: item.id,
            title: item.title,
            releaseDate: item.release_date,
            posterPath: item.poster_path,
            rating: item.vote_average,
          }))
        setSimilarFilms(similar)
        setSimilarPage(1)
        const totalPages = similarRes.data?.total_pages ?? 1
        setSimilarHasMore(1 < totalPages)
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) {
          setSimilarLoading(false)
          setLoading(false)
        }
      }
    }

    fetchData()
    return () => { active = false }
  }, [filmId])

  useEffect(() => {
    let active = true
    if (!filmId || Number.isNaN(filmId)) return
    setListsLoading(true)
    getFilmLists(filmId)
      .then((data) => {
        if (!active) return
        setAppearsInLists(data?.lists ?? [])
        setAppearsTotal(data?.total ?? 0)
      })
      .catch(() => null)
      .finally(() => {
        if (active) setListsLoading(false)
      })
    return () => {
      active = false
    }
  }, [filmId])

  useEffect(() => {
    if (!addToListOpen) return
    setAddListError(null)
    setMyLists([])
    if (!accessToken) {
      setAddListError("Log in to view your lists.")
      return
    }
    setMyListsLoading(true)
    getMyLists()
      .then((data) => {
        const created = data?.created ?? []
        const collaborating = data?.collaborating ?? []
        const merged = [...created, ...collaborating]
        const seen = new Set<string>()
        const deduped = merged.filter((item) => {
          if (!item?.id || seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
        setMyLists(deduped)
      })
      .catch((err: any) => setAddListError(err?.message ?? "Failed to load lists."))
      .finally(() => setMyListsLoading(false))
  }, [addToListOpen, accessToken])

  useEffect(() => {
    if (!filmId || Number.isNaN(filmId)) return
    api.get(`/films/${filmId}/oscars`)
      .then((res) => setOscars(res.data?.oscars ?? []))
      .catch(() => setOscars([]))
  }, [filmId])

  useEffect(() => {
    if (!chatOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChatOpen(false)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [chatOpen])

  useEffect(() => {
    if (!chatOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [chatOpen])

  const handleLoadMoreSimilar = async () => {
    if (similarLoading || !similarHasMore) return
    const nextPage = similarPage + 1
    setSimilarLoading(true)
    try {
      const res = await api.get(`/films/${filmId}/similar`, { params: { page: nextPage } })
      const results = (res.data?.results ?? [])
        .filter((item: any) => item.id !== filmId && Boolean(item.poster_path))
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          releaseDate: item.release_date,
          posterPath: item.poster_path,
          rating: item.vote_average,
        }))
      setSimilarFilms((prev) => {
        const existingIds = new Set(prev.map((film: any) => film.id))
        const deduped = results.filter((film: any) => !existingIds.has(film.id))
        return [...prev, ...deduped]
      })
      setSimilarPage(nextPage)
      const totalPages = res.data?.total_pages ?? nextPage
      setSimilarHasMore(nextPage < totalPages)
    } catch (err) {
      console.error("Failed to load more similar films:", err)
    } finally {
      setSimilarLoading(false)
    }
  }

  const handleAddToLists = async () => {
    if (!details || listSelection.size === 0) {
      setAddToListOpen(false)
      return
    }
    setAddListBusy(true)
    setAddListError(null)
    try {
      const ids = Array.from(listSelection)
      const result = await bulkAddFilmToLists(details.film.id, ids)
      if (result.unauthorized.length > 0) {
        setAddListError("You don’t have permission to edit some selected lists.")
        return
      }
      if (result.added.length === 0 && result.skipped.length > 0) {
        setAddListError("Film is already in the selected lists.")
        return
      }
      setAddToListOpen(false)
      setListSelection(new Set())
    } catch (err: any) {
      setAddListError(err?.message ?? "Failed to add film to list.")
    } finally {
      setAddListBusy(false)
    }
  }

  useEffect(() => {
    if (!user || !filmId || Number.isNaN(filmId)) return

    api.get(`/watchlist/default/items/${filmId}`)
      .then((res) => setInWatchlist(Boolean(res.data?.inWatchlist)))
      .catch(() => setInWatchlist(false))

    getWatchedStatus(filmId)
      .then((result) => setWatched(result.watched))
      .catch(() => setWatched(false))

    api.get(`/ratings/film/${filmId}`)
      .then((res) => setRating(res.data as Rating | null))
      .catch(() => setRating(null))

    api
      .get(`/films/${filmId}/reviews`, { params: { page: 1, pageSize: 50, sortBy: "newest" } })
      .then((res) => {
        const results = (res.data?.results ?? []) as Review[]
        const mine = results.find((review) => review.userId === user.id) ?? null
        setUserReview(mine)
      })
      .catch(() => setUserReview(null))
  }, [filmId, user])

  useEffect(() => {
    if (location.hash === "#review") {
      setShowReviewForm(true)
    }
  }, [location.hash])

  const handleWatchedToggle = async () => {
    if (!user) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
      navigate(`/login?next=${next}`)
      return
    }
    if (watchedBusy) return
    setWatchedBusy(true)
    try {
      const result = await toggleWatched(filmId)
      setWatched(result.watched)
    } catch (err) {
      console.error("Failed to toggle watched:", err)
    } finally {
      setWatchedBusy(false)
    }
  }

  const handleWatchlistToggle = async () => {
    if (!user) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
      navigate(`/login?next=${next}`)
      return
    }
    if (watchlistBusy || watched) return
    setWatchlistBusy(true)
    try {
      const res = await api.post(`/watchlist/default/items/${filmId}/toggle`)
      setInWatchlist(Boolean(res.data?.inWatchlist))
    } catch (err) {
      console.error("Failed to toggle watchlist:", err)
    } finally {
      setWatchlistBusy(false)
    }
  }

  const handleRatingChange = async (nextRating: number) => {
    if (!user || ratingBusy || userReview) return
    setRatingBusy(true)
    setPendingRating(nextRating)
    try {
      if (rating?.id) {
        const res = await api.patch(`/ratings/${rating.id}`, { rating: nextRating })
        setRating(res.data as Rating)
      } else {
        const res = await api.post(`/ratings`, { filmId, rating: nextRating })
        setRating(res.data as Rating)
      }
    } catch (err) {
      console.error("Failed to update rating:", err)
    } finally {
      setRatingBusy(false)
      setPendingRating(null)
    }
  }

  const handleReviewSubmit = async (values: {
    rating: number
    comment: string
    containsSpoilers: boolean
    rewatch: boolean
    watchedDate?: string
  }) => {
    if (!user || !filmId) return
    const res = await api.post("/reviews", {
      filmId,
      rating: values.rating,
      comment: values.comment,
      containsSpoilers: values.containsSpoilers,
      rewatch: values.rewatch,
      watchedDate: values.watchedDate,
    })
    setUserReview(res.data as Review)
    setReviewRefreshKey((prev) => prev + 1)
    setShowReviewForm(false)
  }

  const openLightbox = (images: string[], index: number) => {
    if (images.length === 0) return
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false)
      if (event.key === "ArrowRight") setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
      if (event.key === "ArrowLeft") setLightboxIndex((prev) => prev - 1 < 0 ? lightboxImages.length - 1 : prev - 1)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxOpen, lightboxImages.length])

  if (!details && !loading && !error) return null

  const posterUrl = resolvePosterUrl(details?.film.posterPath ?? null, "w500")
  const year = formatYear(details?.film.releaseDate)
  const runtime = formatRuntime(details?.film.runtime)
  const backdrops = (details?.film.backdrops ?? []).filter(Boolean)
  const cast = details?.credits?.cast?.slice(0, 10) ?? []
  const director = details?.credits?.crew?.find((m) => m.job?.toLowerCase() === "director")
  const shownRating = pendingRating ?? userReview?.rating ?? rating?.rating ?? 0

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-12">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-white/50">
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-rose-200">
            {error}
          </div>
        )}

        {details && (
          <>
            {/* Film Header - Clean Vertical Layout */}
            <section className="mb-12 overflow-hidden rounded-3xl border border-white/10 bg-[rgb(18,18,24)] shadow-2xl shadow-black/40">
              <div className="relative">
                {details.film.backdropPath && (
                  <img
                    src={`https://image.tmdb.org/t/p/w1280${details.film.backdropPath}`}
                    alt={details.film.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[rgb(8,8,12)] via-[rgb(8,8,12)]/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(8,8,12)] via-transparent to-[rgb(8,8,12)]/50" />

                <div className="relative grid gap-8 px-6 py-8 md:grid-cols-[280px,1fr]">
                  {/* Poster */}
                  <div className="relative">
                    <div className="aspect-[2/3] w-full max-w-[280px] overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={details.film.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[2/3] items-center justify-center bg-white/5 text-white/30">
                          No poster
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-4 left-4 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                      Film
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      {details.film.genres && details.film.genres.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {details.film.genres.slice(0, 4).map((genre) => (
                            <span key={genre} className="text-xs font-medium text-white/50">
                              {genre}
                            </span>
                          ))}
                        </div>
                      )}
                      <h1 className="font-['Outfit'] text-3xl font-bold text-white md:text-4xl">
                        {details.film.title}
                      </h1>
                      {details.film.tagline && (
                        <p className="mt-2 text-base italic text-white/50">"{details.film.tagline}"</p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                        <Star className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                        {details.stats?.averageRating !== null && details.stats?.averageRating !== undefined
                          ? details.stats.averageRating.toFixed(1)
                          : "—"}
                        <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-200/80">
                          Filmly
                        </span>
                      </span>
                      {details.film.tmdbRating !== null && details.film.tmdbRating !== undefined && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          {details.film.tmdbRating.toFixed(1)}
                          <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
                            TMDB
                          </span>
                        </span>
                      )}
                      {oscars.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const byYear = new Map<string, { year: string; won: boolean }>()
                            oscars.forEach((entry) => {
                              const current = byYear.get(entry.year)
                              if (!current) {
                                byYear.set(entry.year, { year: entry.year, won: entry.won })
                              } else if (entry.won) {
                                current.won = true
                              }
                            })
                            return Array.from(byYear.values())
                              .sort((a, b) => Number(b.year) - Number(a.year))
                              .map((entry) => (
                                <button
                                  key={`${entry.year}-${entry.won ? "win" : "nom"}`}
                                  type="button"
                                  onClick={() => setOscarsOpen(true)}
                                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                                    entry.won
                                      ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                                      : "border-white/10 bg-white/5 text-white/70"
                                  }`}
                                >
                                  🏆 {entry.won ? "Oscar Winner" : "Oscar Nominee"} {entry.year}
                                </button>
                              ))
                          })()}
                        </div>
                      )}
                      {year && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                          <Calendar className="h-4 w-4" />
                          {year}
                        </span>
                      )}
                      {runtime && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                          <Clock className="h-4 w-4" />
                          {runtime}
                        </span>
                      )}
                      {director && (
                        <Link
                          to={`/person/${director.id}`}
                          className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:border-amber-300/60 hover:text-amber-100"
                        >
                          Dir. {director.name}
                        </Link>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleWatchlistToggle}
                        disabled={watchlistBusy || watched}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${watched
                          ? "cursor-not-allowed bg-white/5 text-white/40"
                          : inWatchlist
                            ? "bg-amber-400 text-black"
                            : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                      >
                        {inWatchlist ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        {inWatchlist ? "In Watchlist" : "Watchlist"}
                      </button>

                      <button
                        type="button"
                        onClick={handleWatchedToggle}
                        disabled={watchedBusy}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${watched
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                      >
                        {watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {watched ? "Watched" : "Mark Watched"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!user) {
                            const next = encodeURIComponent(
                              `${window.location.pathname}${window.location.search}`,
                            )
                            navigate(`/login?next=${next}`)
                            return
                          }
                          setShowReviewForm(true)
                        }}
                        disabled={Boolean(userReview)}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${userReview
                            ? "cursor-not-allowed bg-white/5 text-white/40"
                            : "bg-white/10 text-white hover:bg-white/20"
                          }`}
                      >
                        <Star className="h-4 w-4" />
                        {userReview ? "Reviewed" : "Review"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        className="flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20"
                      >
                        Discussion
                      </button>
                    </div>

                    {/* User Rating */}
                    {user && (
                      <div className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                        <span className="text-xs font-medium text-white/50">Your rating</span>
                        <RatingStars
                          value={shownRating}
                          onChange={handleRatingChange}
                          readOnly={ratingBusy || Boolean(userReview)}
                          step={0.5}
                          size="sm"
                          label="Your rating"
                        />
                        <span className="text-sm font-semibold text-amber-400">
                          {shownRating > 0 ? shownRating.toFixed(1) : "-"}
                        </span>
                      </div>
                    )}

                    {/* Overview */}
                    {details.film.overview && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                          Overview
                        </h3>
                        <p className="text-sm leading-relaxed text-white/70">
                          {details.film.overview}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Cast */}
            {cast.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 font-['Outfit'] text-xl font-bold text-white">Cast</h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                  {cast.map((member) => (
                    <Link
                      key={member.id}
                      to={`/person/${member.id}`}
                      className="flex items-center gap-3 rounded-xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-white/10">
                        <img
                          src={
                            member.profile_path
                              ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                              : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><rect width='160' height='160' fill='%2315161c'/><circle cx='80' cy='60' r='28' fill='%23333a45'/><path d='M32 150c7-28 32-46 48-46s41 18 48 46' fill='%23333a45'/></svg>"
                          }
                          alt={member.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{member.name}</p>
                        {member.character && (
                          <p className="truncate text-xs text-white/50">{member.character}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Images */}
            {backdrops.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 font-['Outfit'] text-xl font-bold text-white">Images</h2>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {backdrops.slice(0, 8).map((path, index) => (
                    <button
                      key={`${path}-${index}`}
                      type="button"
                      onClick={() => openLightbox(backdrops, index)}
                      className="group overflow-hidden rounded-xl border border-white/10"
                    >
                      <img
                        src={`https://image.tmdb.org/t/p/w780${path}`}
                        alt=""
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </section>
          )}

          {/* Discussion */}
          <section className="mt-12" />

          {/* Reviews */}
          <section className="mb-12" id="reviews">
            <h2 className="mb-4 font-['Outfit'] text-xl font-bold text-white">Reviews</h2>
            <ReviewList
              filmId={filmId}
              refreshKey={reviewRefreshKey}
              onReviewDeleted={() => {
                setUserReview(null)
                setReviewRefreshKey((prev) => prev + 1)
              }}
            />
            </section>

            {/* Appears in Lists */}
            <section className="mb-12">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-['Outfit'] text-xl font-bold text-white">Appears in Lists</h2>
                  <p className="text-sm text-white/50">
                    {appearsTotal ? `${appearsTotal} lists` : "No lists yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddToListOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20"
                >
                  <Plus className="h-4 w-4" />
                  Add to List
                </button>
              </div>

              {listsLoading && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                  Loading lists...
                </div>
              )}
              {!listsLoading && appearsInLists.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {appearsInLists.map((item) => {
                    const list = item.list
                    const rank = item.rank
                    return (
                      <Link
                        key={list.id}
                        to={`/lists/${list.slug}`}
                        className="min-w-[240px] rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20 hover:bg-white/10"
                      >
                        <div className="relative h-28 overflow-hidden rounded-xl bg-white/5">
                          {list.coverImagePath ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w780${list.coverImagePath}`}
                              alt={list.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                              No cover
                            </div>
                          )}
                        </div>
                        <div className="mt-3 space-y-1">
                          <p className="line-clamp-2 text-sm font-semibold text-white">
                            {list.title}
                          </p>
                          <p className="text-xs text-white/50">
                            @{list.user?.username ?? "creator"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3 w-3 text-amber-300" />
                              {list.likeCount}
                            </span>
                            {list.isRanked && rank && (
                              <span className="text-amber-200">#{rank} ranked</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
              {!listsLoading && appearsInLists.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
                  No public lists yet for this film.
                </div>
              )}
              {appearsTotal > appearsInLists.length && (
                <div className="mt-4">
                  <Link
                      to={`/lists?filmId=${details?.film?.id ?? filmId}`}
                    className="text-sm font-semibold text-amber-200 hover:text-amber-100"
                  >
                    View all {appearsTotal} lists
                  </Link>
                </div>
              )}
            </section>

            {/* Similar Films */}
            {similarFilms.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 font-['Outfit'] text-xl font-bold text-white">You May Also Like</h2>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {similarFilms.map((film) => (
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
                {similarHasMore && (
                  <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMoreSimilar}
                        disabled={similarLoading}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
                      >
                      {similarLoading ? "Loading..." : "More films"}
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {addToListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-['Outfit'] text-lg font-semibold text-white">Add to lists</h3>
              <button
                type="button"
                onClick={() => setAddToListOpen(false)}
                className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addListError && (
              <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {addListError}
              </div>
            )}

            <div className="max-h-64 space-y-2 overflow-auto">
              {myListsLoading && (
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60">
                  Loading your lists...
                </div>
              )}
              {!myListsLoading &&
                myLists.map((list) => (
                  <label
                    key={list.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                  >
                    <input
                      type="checkbox"
                      checked={listSelection.has(list.id)}
                      onChange={(event) => {
                        setListSelection((prev) => {
                          const next = new Set(prev)
                          if (event.target.checked) {
                            next.add(list.id)
                          } else {
                            next.delete(list.id)
                          }
                          return next
                        })
                      }}
                    />
                    <span>{list.title}</span>
                  </label>
                ))}
              {!myListsLoading && myLists.length === 0 && !addListError && (
                <p className="text-sm text-white/60">No lists found.</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setAddToListOpen(false)
                  setCreateListOpen(true)
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Create new list
              </button>
              <button
                type="button"
                onClick={handleAddToLists}
                disabled={addListBusy}
                className="rounded-full border border-amber-400/50 bg-amber-400/20 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addListBusy ? "Adding..." : "Add selected"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createListOpen && <CreateListModal onClose={() => setCreateListOpen(false)} />}

      {/* Review Form Modal */}
      {showReviewForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setShowReviewForm(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-['Outfit'] text-xl font-semibold text-white">Write a Review</h3>
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ReviewForm onSubmit={handleReviewSubmit} submitLabel="Publish Review" />
          </div>
        </div>
      )}

      {oscarsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setOscarsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Academy Awards
                </p>
                <h3 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
                  Oscar Nominations & Wins
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOscarsOpen(false)}
                className="cursor-pointer rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {oscars
                .slice()
                .sort((a, b) => Number(b.year) - Number(a.year))
                .map((entry, idx) => (
                  <div
                    key={`${entry.year}-${entry.category}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{entry.category}</p>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          entry.won
                            ? "border-yellow-400/40 bg-yellow-400/10 text-yellow-200"
                            : "border-white/10 bg-white/5 text-white/60"
                        }`}
                      >
                        {entry.won ? "Winner" : "Nominee"} · {entry.year}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/60">{entry.nominee_name}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {chatOpen && details && (
          <div className="fixed inset-0 z-50 flex flex-col bg-[rgb(10,10,14)]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-4">
                  <div className="h-16 w-12 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    {posterUrl ? (
                      <img src={posterUrl} alt={details.film.title} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                      Discussion
                    </p>
                    <h3 className="mt-1 font-['Outfit'] text-2xl font-semibold text-white">
                      {details.film.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {displayOnlineCount} online
                      </span>
                    </div>
                  </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="cursor-pointer rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
                aria-label="Close discussion"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          <div className="flex-1 overflow-hidden">
            <ChatContainer filmId={details.film.id} />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && lightboxImages[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {lightboxImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => prev - 1 < 0 ? lightboxImages.length - 1 : prev - 1)
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <img
            src={`https://image.tmdb.org/t/p/original${lightboxImages[lightboxIndex]}`}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-sm text-white">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
    </div>
  )
}
