import { useEffect, useState } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import Header from "../../components/layout/Header"
import FilmCard from "../../components/film/FilmCard"
import api, { normalizeApiError } from "../../services/api"
import { Bookmark } from "lucide-react"

export default function WatchlistPage() {
  usePageTitle("Watchlist")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    let active = true
    async function loadWatchlist() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/watchlist/default")
        if (!active) return
        setItems(res.data?.items ?? [])
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadWatchlist()
    return () => { active = false }
  }, [])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-['Outfit'] text-3xl font-bold text-white">Your Watchlist</h1>
          <p className="mt-2 text-sm text-white/50">
            {items.length > 0 ? `${items.length} films to watch` : "Films you want to watch"}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
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
        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <Bookmark className="h-8 w-8 text-white/30" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-semibold text-white">No films yet</h3>
            <p className="mt-1 text-sm text-white/50">Start adding films to your watchlist</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <FilmCard
                key={item.id}
                id={item.film.id}
                title={item.film.title}
                releaseDate={item.film.releaseDate}
                posterPath={item.film.posterPath}
                rating={item.film.tmdbRating}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
