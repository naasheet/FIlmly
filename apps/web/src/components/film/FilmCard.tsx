import { useState } from "react"
import { Link } from "react-router-dom"
import { resolvePosterUrl } from "../../utils/image"

type FilmCardProps = {
  id: number
  title: string
  releaseDate?: string | null
  posterPath?: string | null
  rating?: number | null
  showRating?: boolean
  showViewLabel?: boolean
  watchedDateLabel?: string | null
}

function formatYear(releaseDate?: string | null) {
  if (!releaseDate) return "-"
  const date = new Date(releaseDate)
  return Number.isNaN(date.getTime()) ? "-" : date.getFullYear()
}

export default function FilmCard({
  id,
  title,
  releaseDate,
  posterPath,
  rating,
  showRating = true,
  showViewLabel = true,
  watchedDateLabel = null,
}: FilmCardProps) {
  const [imageError, setImageError] = useState(false)
  const posterUrl = resolvePosterUrl(posterPath, "w342")

  return (
    <div className="film-card group relative flex h-full flex-col">
      {/* Film strip accent on hover */}
      <div className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Watched toggle removed */}

      <Link to={`/films/${id}`} className="flex h-full flex-col">
        {/* Poster container */}
        <div className="relative aspect-[2/3] w-full overflow-hidden">
          {posterUrl && !imageError ? (
            <img
              src={posterUrl}
              alt={title}
              className="film-card-image h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              No poster
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[rgb(8,8,12)] via-transparent to-transparent opacity-80" />

          {/* Hover overlay with glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Vignette effect */}
          <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:shadow-[inset_0_0_80px_rgba(0,0,0,0.3)]" />
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col gap-2 bg-gradient-to-b from-transparent to-[rgb(18,18,24)] px-4 pb-4 pt-3">
          <div>
            <p className="line-clamp-2 font-['Outfit'] text-base font-semibold leading-tight text-white transition-colors duration-300 group-hover:text-amber-100">
              {title}
            </p>
            <p className="mt-1 text-sm text-slate-500">{formatYear(releaseDate)}</p>
            {watchedDateLabel && (
              <p className="mt-2 text-xs font-semibold text-emerald-400">
                {watchedDateLabel}
              </p>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between">
            {showRating ? (
              <span className="rating-badge">
                {rating ? rating.toFixed(1) : "-"} / 10
              </span>
            ) : (
              <span />
            )}
            {showViewLabel && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-all duration-300 group-hover:text-amber-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                View
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
