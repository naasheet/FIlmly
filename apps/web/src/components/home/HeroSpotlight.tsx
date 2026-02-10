import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Play, Plus, Check, Star } from "lucide-react"

type SpotlightFilm = {
    id: number
    title: string
    tagline?: string | null
    overview?: string | null
    backdropPath?: string | null
    posterPath?: string | null
    releaseDate?: string | null
    rating?: number | null
    genres?: string[]
}

interface HeroSpotlightProps {
    films: SpotlightFilm[]
    onAddToWatchlist?: (filmId: number) => void
    watchlistIds?: Set<number>
}

export default function HeroSpotlight({
    films,
    onAddToWatchlist,
    watchlistIds = new Set()
}: HeroSpotlightProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)

    const currentFilm = films[currentIndex]

    // Auto-rotate every 8 seconds
    useEffect(() => {
        if (films.length <= 1) return

        const interval = setInterval(() => {
            setIsTransitioning(true)
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % films.length)
                setIsTransitioning(false)
            }, 500)
        }, 8000)

        return () => clearInterval(interval)
    }, [films.length])

    const goToSlide = (index: number) => {
        if (index === currentIndex) return
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentIndex(index)
            setIsTransitioning(false)
        }, 300)
    }

    if (!currentFilm) return null

    const backdropUrl = currentFilm.backdropPath
        ? `https://image.tmdb.org/t/p/original${currentFilm.backdropPath}`
        : null

    const year = currentFilm.releaseDate
        ? new Date(currentFilm.releaseDate).getFullYear()
        : null

    const inWatchlist = watchlistIds.has(currentFilm.id)

    return (
        <section className="relative h-full w-full overflow-hidden">
            {/* Backdrop Image */}
            {backdropUrl && (
                <div
                    className={`absolute inset-0 transition-opacity duration-700 ${isTransitioning ? "opacity-0" : "opacity-100"
                        }`}
                >
                    <img
                        src={backdropUrl}
                        alt={currentFilm.title}
                        className="h-full w-full object-cover"
                    />
                </div>
            )}

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-[rgb(8,8,12)] via-[rgb(8,8,12)]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgb(8,8,12)] via-transparent to-[rgb(8,8,12)]/40" />

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,transparent_40%,rgba(8,8,12,0.8)_100%)]" />

            {/* Content */}
            <div className="relative flex h-full items-end pb-16">
                <div className="w-full max-w-3xl space-y-6 px-8 lg:px-12">
                    {/* Genres */}
                    {currentFilm.genres && currentFilm.genres.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {currentFilm.genres.slice(0, 3).map((genre) => (
                                <span
                                    key={genre}
                                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm"
                                >
                                    {genre}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title */}
                    <h1
                        className={`font-['Outfit'] text-4xl font-bold leading-tight text-white transition-all duration-500 md:text-5xl lg:text-6xl ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                            }`}
                    >
                        {currentFilm.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                        {currentFilm.rating && (
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-white">{currentFilm.rating.toFixed(1)}</span>
                            </div>
                        )}
                        {year && <span>{year}</span>}
                        {currentFilm.genres && currentFilm.genres[0] && (
                            <span className="hidden sm:inline">{currentFilm.genres[0]}</span>
                        )}
                    </div>

                    {/* Overview */}
                    {currentFilm.overview && (
                        <p
                            className={`max-w-xl text-base leading-relaxed text-slate-300 transition-all duration-500 delay-100 md:text-lg ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                                }`}
                        >
                            {currentFilm.overview.length > 200
                                ? `${currentFilm.overview.slice(0, 200)}...`
                                : currentFilm.overview}
                        </p>
                    )}

                    {/* Actions */}
                    <div
                        className={`flex flex-wrap items-center gap-3 pt-2 transition-all duration-500 delay-200 ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                            }`}
                    >
                        <Link
                            to={`/films/${currentFilm.id}`}
                            className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all duration-200 hover:bg-white/90"
                        >
                            <Play className="h-5 w-5 fill-current" />
                            More Info
                        </Link>

                        <button
                            type="button"
                            onClick={() => onAddToWatchlist?.(currentFilm.id)}
                            className={`flex items-center gap-2 rounded-xl border px-5 py-3 font-medium transition-all duration-200 ${inWatchlist
                                    ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                                    : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            {inWatchlist ? (
                                <>
                                    <Check className="h-5 w-5" />
                                    In Watchlist
                                </>
                            ) : (
                                <>
                                    <Plus className="h-5 w-5" />
                                    Watchlist
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Slide Indicators */}
            {films.length > 1 && (
                <div className="absolute bottom-6 right-8 flex items-center gap-2 lg:right-12">
                    {films.map((film, index) => (
                        <button
                            key={film.id}
                            type="button"
                            onClick={() => goToSlide(index)}
                            className={`h-1 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? "w-8 bg-white"
                                    : "w-2 bg-white/30 hover:bg-white/50"
                                }`}
                            aria-label={`Go to ${film.title}`}
                        />
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {films.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                    <div
                        className="h-full bg-amber-400 transition-all duration-100"
                        style={{
                            width: `${((currentIndex + 1) / films.length) * 100}%`,
                        }}
                    />
                </div>
            )}
        </section>
    )
}
