import { Link, useNavigate } from "react-router-dom"
import { Calendar, MapPin, Tv, Lock } from "lucide-react"
import { MoodBadge } from "./MoodSelector"
import { resolvePosterUrl } from "../../utils/image"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DiaryEntryData = {
    id: string
    filmId: number
    film: {
        id: number
        title: string
        posterPath?: string | null
        releaseDate?: string | null
    }
    watchedDate: string
    mood?: string | null
    expectedRating?: number | null
    expectedNote?: string | null
    actualRating?: number | null
    actualNote?: string | null
    rewatchability?: string | null
    rewatchabilityWhy?: string | null
    location?: string | null
    venue?: string | null
    format?: string | null
    vibes?: string[]
    companions?: string[]
    notes?: string | null
    isPrivate?: boolean
    linkToReview?: boolean
    reviewId?: string | null
}

type DiaryEntryProps = {
    entry: DiaryEntryData
    showFilmInfo?: boolean
    compact?: boolean
    canDelete?: boolean
    onDelete?: (entryId: string) => void
    onOpen?: (entry: DiaryEntryData) => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const LOCATION_LABELS: Record<string, string> = {
    home: "🏠 Home",
    cinema: "🎬 Cinema",
    friends: "👥 Friend's",
    outdoor: "🌳 Outdoor",
    travel: "✈️ Travel",
    other: "📍 Other",
}

const FORMAT_LABELS: Record<string, string> = {
    streaming: "📺 Streaming",
    bluray: "💿 Blu-ray",
    "4k": "📀 4K",
    dvd: "📀 DVD",
    imax: "🎭 IMAX",
    "35mm": "🎞️ 35mm",
    digital: "🖥️ Digital",
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

function formatYear(dateString?: string | null): number | null {
    if (!dateString) return null
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date.getFullYear()
}

function renderCompanions(companions?: string[]) {
    if (!companions || companions.length === 0) return null
    return (
        <span className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
            <span className="text-white/40">With</span>
            {companions.map((username, index) => (
                <span key={`${username}-${index}`} className="inline-flex items-center gap-1">
                    <Link
                        to={`/users/${username}`}
                        onClick={(event) => event.stopPropagation()}
                        className="text-amber-200/90 transition hover:text-amber-200"
                    >
                        @{username}
                    </Link>
                    {index < companions.length - 1 && (
                        <span className="text-white/30">·</span>
                    )}
                </span>
            ))}
        </span>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DiaryEntry({
    entry,
    showFilmInfo = true,
    compact = false,
    canDelete = false,
    onDelete,
    onOpen,
}: DiaryEntryProps) {
    const navigate = useNavigate()
    const posterUrl = resolvePosterUrl(entry.film.posterPath ?? null, "w342")
    const filmYear = formatYear(entry.film.releaseDate)
    const locationLabel = entry.location ? LOCATION_LABELS[entry.location] || entry.location : null
    const formatLabel = entry.format ? FORMAT_LABELS[entry.format] || entry.format : null
    const reviewLink = entry.reviewId
        ? `/films/${entry.filmId}#reviews`
        : `/films/${entry.filmId}#review`
    const reviewLabel = entry.reviewId ? "View review" : "Write review"

    if (compact) {
        return (
            <Link
                to={`/diary/${entry.id}`}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
            >
                {/* Mini Poster */}
                <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {posterUrl ? (
                        <img
                            src={posterUrl}
                            alt={entry.film.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                            ?
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">
                            {entry.film.title}
                        </p>
                        {entry.isPrivate && <Lock className="h-3 w-3 text-white/40" />}
                    </div>
                    <p className="text-xs text-white/50">{formatDate(entry.watchedDate)}</p>
                    {entry.mood && (
                        <div className="mt-1">
                            <MoodBadge mood={entry.mood} size="sm" showLabel={false} />
                        </div>
                    )}
                </div>

            </Link>
        )
    }

    if (onOpen) {
        return (
            <button
                type="button"
                onClick={() => onOpen(entry)}
                className="group block w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] text-left transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
                <div className="flex gap-4 p-4">
                    {/* Poster */}
                    {showFilmInfo && (
                        <div className="w-20 flex-shrink-0">
                            <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                                {posterUrl ? (
                                    <img
                                        src={posterUrl}
                                        alt={entry.film.title}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/30">
                                        ?
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1 space-y-3">
                        {/* Header */}
                        <div>
                            {showFilmInfo && (
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-['Outfit'] text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                                            {entry.film.title}
                                        </h3>
                                        {filmYear && (
                                            <span className="text-xs text-white/50">{filmYear}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {entry.isPrivate && (
                                            <span className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300">
                                                <Lock className="h-3 w-3" />
                                                Private
                                            </span>
                                        )}
                                        {canDelete && (
                                            <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(event) => {
                                                    event.preventDefault()
                                                    event.stopPropagation()
                                                    onDelete?.(entry.id)
                                                }}
                                                onKeyDown={(event) => {
                                                    if (event.key === "Enter" || event.key === " ") {
                                                        event.preventDefault()
                                                        event.stopPropagation()
                                                        onDelete?.(entry.id)
                                                    }
                                                }}
                                                className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-400/20"
                                            >
                                                Delete
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!showFilmInfo && (
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white">
                                        {formatDate(entry.watchedDate)}
                                    </p>
                                    {entry.isPrivate && <Lock className="h-3 w-3 text-white/40" />}
                                </div>
                            )}
                        </div>

                        {/* Meta */}
                        <div className="flex flex-wrap gap-2 text-xs text-white/60">
                            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(entry.watchedDate)}
                            </span>
                            {locationLabel && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                    <MapPin className="h-3 w-3" />
                                    {locationLabel}
                                </span>
                            )}
                            {formatLabel && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                    <Tv className="h-3 w-3" />
                                    {formatLabel}
                                </span>
                            )}
                            {entry.linkToReview && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1">
                                    Review linked
                                </span>
                            )}
                            {renderCompanions(entry.companions)}
                        </div>

                        {/* Mood + Vibes */}
                        <div className="flex flex-wrap items-center gap-2">
                            {entry.mood && (
                                <MoodBadge mood={entry.mood} showLabel={true} size="sm" />
                            )}
                            {entry.vibes && entry.vibes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {entry.vibes.slice(0, 4).map((vibe) => (
                                        <span
                                            key={vibe}
                                            className="rounded-full border border-violet-400/20 bg-violet-400/5 px-2 py-0.5 text-xs text-violet-300"
                                        >
                                            {vibe}
                                        </span>
                                    ))}
                                    {entry.vibes.length > 4 && (
                                        <span className="text-xs text-white/40">
                                            +{entry.vibes.length - 4} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Notes Preview */}
                        {entry.notes && (
                            <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
                                {entry.notes}
                            </p>
                        )}
                    </div>
                </div>
            </button>
        )
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/diary/${entry.id}`)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    navigate(`/diary/${entry.id}`)
                }
            }}
            className="group block w-full overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] text-left transition-all hover:border-white/10 hover:bg-white/[0.04]"
        >
            <div className="flex gap-4 p-4">
                {/* Poster */}
                {showFilmInfo && (
                    <div className="w-20 flex-shrink-0">
                        <div className="aspect-[2/3] overflow-hidden rounded-xl bg-white/5">
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={entry.film.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-white/30">
                                    ?
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-3">
                    {/* Header */}
                    <div>
                        {showFilmInfo && (
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-['Outfit'] text-base font-semibold text-white group-hover:text-amber-400 transition-colors">
                                        {entry.film.title}
                                    </h3>
                                    {filmYear && (
                                        <span className="text-xs text-white/50">{filmYear}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {entry.isPrivate && (
                                        <span className="flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-300">
                                            <Lock className="h-3 w-3" />
                                            Private
                                        </span>
                                    )}
                                    {canDelete && (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault()
                                                event.stopPropagation()
                                                onDelete?.(entry.id)
                                            }}
                                            className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-400/20"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Date */}
                        <div className="mt-1 flex items-center gap-1 text-xs text-white/50">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.watchedDate)}
                        </div>
                    </div>

                    {/* Mood */}
                    {entry.mood && (
                        <div>
                            <MoodBadge mood={entry.mood} size="sm" />
                        </div>
                    )}

                    {/* Meta Row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Location */}
                        {locationLabel && (
                            <span className="flex items-center gap-1 text-white/50">
                                <MapPin className="h-3 w-3" />
                                {entry.venue || locationLabel}
                            </span>
                        )}

                        {/* Format */}
                        {formatLabel && (
                            <span className="flex items-center gap-1 text-white/50">
                                <Tv className="h-3 w-3" />
                                {formatLabel}
                            </span>
                        )}

                        {entry.linkToReview && (
                            <Link
                                to={reviewLink}
                                onClick={(event) => {
                                    event.stopPropagation()
                                }}
                                className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70 transition hover:border-amber-400/40 hover:text-amber-200"
                            >
                                {reviewLabel}
                            </Link>
                        )}
                        {renderCompanions(entry.companions)}
                    </div>

                    {/* Vibes */}
                    {entry.vibes && entry.vibes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {entry.vibes.slice(0, 4).map((vibe) => (
                                <span
                                    key={vibe}
                                    className="rounded-full border border-violet-400/20 bg-violet-400/5 px-2 py-0.5 text-xs text-violet-300"
                                >
                                    {vibe}
                                </span>
                            ))}
                            {entry.vibes.length > 4 && (
                                <span className="text-xs text-white/40">
                                    +{entry.vibes.length - 4} more
                                </span>
                            )}
                        </div>
                    )}

                    {/* Notes Preview */}
                    {entry.notes && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-white/60">
                            {entry.notes}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Calendar Day Variant
// ─────────────────────────────────────────────────────────────────────────────

type DiaryDayProps = {
    date: string
    entries: Array<{
        id: string
        filmId: number
        filmTitle: string
        filmPoster: string | null
        mood: string | null
    }>
    onSelect?: (date: string, entries: DiaryDayProps["entries"]) => void
}

/** Compact view for calendar cells */
export function DiaryDay({ date, entries, onSelect }: DiaryDayProps) {
    const day = new Date(date).getDate()

    if (entries.length === 0) {
        return (
            <div className="flex h-20 flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.01] text-white/30">
                <span className="text-sm">{day}</span>
            </div>
        )
    }

    if (onSelect) {
        return (
            <button
                type="button"
                onClick={() => onSelect(date, entries)}
                className="group relative flex h-20 w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-1 text-left transition-all hover:border-amber-400/30"
            >
                {/* Date */}
                <span className="text-xs font-medium text-white/70">{day}</span>

                {/* Film posters */}
                <div className="mt-auto flex -space-x-2">
                    {entries.slice(0, 3).map((entry, idx) => (
                        <div
                            key={entry.id}
                            className="h-8 w-6 overflow-hidden rounded border border-white/20 bg-white/10"
                            style={{ zIndex: entries.length - idx }}
                        >
                            {entry.filmPoster ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w92${entry.filmPoster}`}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-[8px] text-white/30">
                                    ?
                                </div>
                            )}
                        </div>
                    ))}
                    {entries.length > 3 && (
                        <span className="flex h-8 w-6 items-center justify-center rounded border border-white/10 bg-white/10 text-[10px] text-white/50">
                            +{entries.length - 3}
                        </span>
                    )}
                </div>

                {/* Mood indicator */}
                {entries[0]?.mood && (
                    <div className="absolute right-1 top-1">
                        <MoodBadge mood={entries[0].mood} showLabel={false} size="sm" />
                    </div>
                )}
            </button>
        )
    }

    return (
        <Link
            to={`/diary?date=${date}`}
            className="group relative flex h-20 w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] p-1 text-left transition-all hover:border-amber-400/30"
        >
            {/* Date */}
            <span className="text-xs font-medium text-white/70">{day}</span>

            {/* Film posters */}
            <div className="mt-auto flex -space-x-2">
                {entries.slice(0, 3).map((entry, idx) => (
                    <div
                        key={entry.id}
                        className="h-8 w-6 overflow-hidden rounded border border-white/20 bg-white/10"
                        style={{ zIndex: entries.length - idx }}
                    >
                        {entry.filmPoster ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w92${entry.filmPoster}`}
                                alt=""
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-white/30">
                                ?
                            </div>
                        )}
                    </div>
                ))}
                {entries.length > 3 && (
                    <span className="flex h-8 w-6 items-center justify-center rounded border border-white/10 bg-white/10 text-[10px] text-white/50">
                        +{entries.length - 3}
                    </span>
                )}
            </div>

            {/* Mood indicator */}
            {entries[0]?.mood && (
                <div className="absolute right-1 top-1">
                    <MoodBadge mood={entries[0].mood} showLabel={false} size="sm" />
                </div>
            )}
        </Link>
    )
}
