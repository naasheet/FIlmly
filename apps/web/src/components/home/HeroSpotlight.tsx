import { useEffect, useRef, useState, type TouchEvent } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Play, Star } from "lucide-react"

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
    contentAlign?: "center" | "end"
}

export default function HeroSpotlight({
    films,
    contentAlign = "end",
}: HeroSpotlightProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const touchStartX = useRef<number | null>(null)
    const touchEndX = useRef<number | null>(null)

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

    const stepSlide = (delta: number) => {
        if (films.length <= 1) return
        setIsTransitioning(true)
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + delta + films.length) % films.length)
            setIsTransitioning(false)
        }, 300)
    }

    const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
        touchStartX.current = event.touches[0]?.clientX ?? null
        touchEndX.current = null
    }

    const handleTouchMove = (event: TouchEvent<HTMLElement>) => {
        touchEndX.current = event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = () => {
        if (touchStartX.current === null || touchEndX.current === null) return
        const delta = touchStartX.current - touchEndX.current
        if (Math.abs(delta) < 50) return
        if (delta > 0) {
            stepSlide(1)
        } else {
            stepSlide(-1)
        }
    }

    if (!currentFilm) return null

    const backdropUrl = currentFilm.backdropPath
        ? `https://image.tmdb.org/t/p/original${currentFilm.backdropPath}`
        : null

    const year = currentFilm.releaseDate
        ? new Date(currentFilm.releaseDate).getFullYear()
        : null

    return (
        <section
            className="group relative h-full w-full overflow-hidden animate-fade-in"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
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
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.92)_0%,rgba(15,23,42,0.6)_45%,rgba(15,23,42,0)_70%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,8,12,0.65)] via-transparent to-[rgba(8,8,12,0.25)]" />

            {/* Left-side vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_left,rgba(8,8,12,0.55)_0%,rgba(8,8,12,0.2)_45%,transparent_70%)]" />

            {/* Content */}
            <div
                className={`relative flex h-full ${contentAlign === "center"
                    ? "items-center py-14"
                    : "items-end pb-16"
                    }`}
            >
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
                        style={{ textShadow: "0 4px 12px rgba(0, 0, 0, 0.8)" }}
                    >
                        {currentFilm.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                        {currentFilm.rating && (
                            <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
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
                            className={`max-w-xl min-h-[4.5rem] text-base leading-relaxed text-slate-200 transition-all duration-500 delay-100 md:min-h-[5.5rem] md:text-lg ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                                } line-clamp-3 md:line-clamp-4`}
                            style={{ textShadow: "0 3px 10px rgba(0, 0, 0, 0.7)" }}
                        >
                            {currentFilm.overview}
                        </p>
                    )}

                    {/* Actions */}
                    <div
                        className={`flex flex-wrap items-center gap-3 pt-2 transition-all duration-500 delay-200 ${isTransitioning ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
                            }`}
                    >
                        <Link
                            to={`/films/${currentFilm.id}`}
                            className="group flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-black shadow-[0_10px_24px_rgba(0,0,0,0.35)] transition-all duration-200 hover:scale-[1.05] hover:bg-white/90 hover:shadow-[0_12px_28px_rgba(0,0,0,0.4)] active:scale-[0.98]"
                        >
                            <Play className="h-5 w-5 fill-current transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" />
                            More Info
                        </Link>
                    </div>
                </div>
            </div>

            {/* Arrow Navigation */}
            {films.length > 1 && (
                <>
                    <button
                        type="button"
                        aria-label="Previous slide"
                        onClick={() => stepSlide(-1)}
                        className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 p-2.5 text-white/80 opacity-0 backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-black/50 hover:text-white group-hover:pointer-events-auto group-hover:opacity-100 md:flex"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Next slide"
                        onClick={() => stepSlide(1)}
                        className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 p-2.5 text-white/80 opacity-0 backdrop-blur transition-all duration-300 hover:border-white/40 hover:bg-black/50 hover:text-white group-hover:pointer-events-auto group-hover:opacity-100 md:flex"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}

            {/* Slide Indicators */}
            {films.length > 1 && (
                <div className="absolute bottom-6 right-8 flex items-center gap-2.5 lg:right-12">
                    {films.map((film, index) => (
                        <button
                            key={film.id}
                            type="button"
                            onClick={() => goToSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                ? "w-9 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.55)]"
                                : "w-3 bg-white/40 hover:bg-white/70"
                                }`}
                            aria-label={`Go to ${film.title}`}
                        />
                    ))}
                </div>
            )}

            {/* Mobile swipe hint */}
            {films.length > 1 && (
                <div className="pointer-events-none absolute bottom-6 left-8 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/50 backdrop-blur md:hidden">
                    Swipe &lt; &gt;
                </div>
            )}
        </section>
    )
}
