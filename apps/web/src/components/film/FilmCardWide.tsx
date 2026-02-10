import { Link } from "react-router-dom"
import { Star, Clock, Eye, EyeOff, Plus, Check } from "lucide-react"
import { useState } from "react"

interface FilmCardWideProps {
    id: number
    title: string
    backdropPath?: string | null
    posterPath?: string | null
    releaseDate?: string | null
    rating?: number | null
    runtime?: number | null
    overview?: string | null
    watched?: boolean
    inWatchlist?: boolean
    onToggleWatched?: () => void
    onToggleWatchlist?: () => void
}

export default function FilmCardWide({
    id,
    title,
    backdropPath,
    posterPath,
    releaseDate,
    rating,
    runtime,
    overview,
    watched = false,
    inWatchlist = false,
    onToggleWatched,
    onToggleWatchlist,
}: FilmCardWideProps) {
    const [imageLoaded, setImageLoaded] = useState(false)
    const [showActions, setShowActions] = useState(false)

    const imageUrl = backdropPath
        ? `https://image.tmdb.org/t/p/w780${backdropPath}`
        : posterPath
            ? `https://image.tmdb.org/t/p/w342${posterPath}`
            : null

    const year = releaseDate ? new Date(releaseDate).getFullYear() : null

    const formatRuntime = (mins: number) => {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        return h > 0 ? `${h}h ${m}m` : `${m}m`
    }

    return (
        <div
            className="group relative w-[320px] shrink-0 overflow-hidden rounded-xl border border-white/5 bg-[rgb(18,18,24)] transition-all duration-300 hover:border-white/20 hover:ring-1 hover:ring-white/10 md:w-[380px]"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <Link to={`/films/${id}`} className="block">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-slate-900">
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={title}
                            className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-100" : "opacity-0"
                                }`}
                            onLoad={() => setImageLoaded(true)}
                        />
                    )}

                    {!imageLoaded && (
                        <div className="absolute inset-0 animate-pulse bg-slate-800" />
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgb(18,18,24)] via-transparent to-transparent" />

                    {/* Rating badge */}
                    {rating && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 backdrop-blur-sm">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-semibold text-white">
                                {rating.toFixed(1)}
                            </span>
                        </div>
                    )}

                    {/* Watched indicator */}
                    {watched && (
                        <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 backdrop-blur-sm">
                            <Eye className="h-4 w-4" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    <h3 className="font-['Outfit'] text-base font-semibold text-white line-clamp-1 group-hover:text-amber-400 transition-colors duration-200">
                        {title}
                    </h3>

                    <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
                        {year && <span>{year}</span>}
                        {runtime && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRuntime(runtime)}
                            </span>
                        )}
                    </div>

                    {overview && (
                        <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
                            {overview}
                        </p>
                    )}
                </div>
            </Link>

            {/* Quick Actions */}
            <div
                className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-gradient-to-t from-[rgb(18,18,24)] via-[rgb(18,18,24)] to-transparent p-4 pt-8 transition-all duration-300 ${showActions ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}
            >
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        if (watched) return
                        onToggleWatchlist?.()
                    }}
                    disabled={watched}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium transition-all duration-200 ${watched
                            ? "cursor-not-allowed bg-white/5 text-white/40"
                            : inWatchlist
                            ? "bg-amber-400/10 text-amber-400"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                >
                    {inWatchlist ? (
                        <>
                            <Check className="h-4 w-4" />
                            Added
                        </>
                    ) : (
                        <>
                            <Plus className="h-4 w-4" />
                            Watchlist
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault()
                        onToggleWatched?.()
                    }}
                    className={`flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${watched
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                >
                    {watched ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
            </div>
        </div>
    )
}
