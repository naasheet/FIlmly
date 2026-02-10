import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Header from "../../components/layout/Header"
import api, { normalizeApiError } from "../../services/api"
import { Star, Heart, MessageCircle, PenLine } from "lucide-react"

export default function ReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    let active = true
    async function loadReviews() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/reviews/me")
        if (!active) return
        setReviews(res.data ?? [])
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadReviews()
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-['Outfit'] text-3xl font-bold text-white">Your Reviews</h1>
          <p className="mt-2 text-sm text-white/50">
            {reviews.length > 0 ? `${reviews.length} reviews written` : "Your film reviews"}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && reviews.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <PenLine className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-semibold text-white">No reviews yet</h3>
            <p className="mt-1 text-sm text-white/50">Start reviewing films you've watched</p>
          </div>
        )}

        {/* Reviews */}
        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Link
                key={review.id}
                to={`/films/${review.film.id}`}
                className="group flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                {/* Poster */}
                <div className="w-16 shrink-0 overflow-hidden rounded-lg">
                  {review.film.posterPath ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w154${review.film.posterPath}`}
                      alt={review.film.title}
                      className="w-full"
                    />
                  ) : (
                    <div className="flex aspect-[2/3] items-center justify-center bg-white/5 text-xs text-white/30">
                      ?
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-['Outfit'] font-semibold text-white group-hover:text-amber-400">
                        {review.film.title}
                      </h3>
                      <p className="text-xs text-white/40">
                        {review.updatedAt
                          ? new Date(review.updatedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                          : "Recently"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-amber-400/10 px-2 py-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-amber-400">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-white/60 line-clamp-2">
                    {review.comment || "No comment"}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {review._count?.likes ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {review._count?.comments ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
