import { useEffect, useState } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useParams, useNavigate, Link } from "react-router-dom"
import Header from "../../components/layout/Header"
import { getDiaryEntry } from "../../services/diaryService"
import { resolvePosterUrl } from "../../utils/image"
import RatingStars from "../../components/ui/RatingStars"

type DiaryEntryDetail = {
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
}

export default function DiaryEntryPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [entry, setEntry] = useState<DiaryEntryDetail | null>(null)
    usePageTitle(entry?.film.title ? `Diary: ${entry.film.title}` : null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return
        setLoading(true)
        setError(null)
        getDiaryEntry(id)
            .then((data) => setEntry(data as DiaryEntryDetail))
            .catch((err: any) => setError(err?.message ?? "Unable to load entry"))
            .finally(() => setLoading(false))
    }, [id])

    const formatLabel = (value?: string | null) => {
        if (!value) return ""
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    return (
        <div className="min-h-screen bg-black">
            <Header />
            <main className="mx-auto max-w-5xl px-4 py-8">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                    Back
                </button>

                {loading ? (
                    <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
                ) : error ? (
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
                        {error}
                    </div>
                ) : !entry ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                        Entry not found.
                    </div>
                ) : (
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                        <div className="flex flex-col gap-6 sm:flex-row">
                            <div className="w-36 flex-shrink-0">
                                <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                    {entry.film.posterPath ? (
                                        <img
                                            src={resolvePosterUrl(entry.film.posterPath ?? null, "w342") ?? ""}
                                            alt={entry.film.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
                                            No poster
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-4">
                                <div>
                                    <h1 className="font-['Outfit'] text-2xl font-semibold text-white">
                                        {entry.film.title}
                                    </h1>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Watched date
                                        </p>
                                        <p className="mt-1 text-white">
                                            {new Date(entry.watchedDate).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Location
                                        </p>
                                        <p className="mt-1 text-white">
                                            {(entry.venue ?? formatLabel(entry.location ?? "")) || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Format
                                        </p>
                                        <p className="mt-1 text-white">
                                            {entry.format ? formatLabel(entry.format) : "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Mood
                                        </p>
                                        <p className="mt-1 text-white">
                                            {entry.mood ? formatLabel(entry.mood) : "-"}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-wider text-white/40">
                                        Vibes
                                    </p>
                                    <p className="mt-1 text-white">
                                        {entry.vibes && entry.vibes.length > 0 ? entry.vibes.join(", ") : "-"}
                                    </p>
                                </div>

                                {(entry.expectedRating !== null && entry.expectedRating !== undefined) ||
                                (entry.actualRating !== null && entry.actualRating !== undefined) ||
                                entry.expectedNote ||
                                entry.actualNote ? (
                                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Expectation vs Reality
                                        </p>
                                        <div className="mt-3 grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-white/40">
                                                    Expected
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <RatingStars
                                                        value={entry.expectedRating ?? 0}
                                                        readOnly={true}
                                                        step={0.5}
                                                        size="sm"
                                                        label="Expected rating"
                                                    />
                                                    <span className="text-xs text-amber-300">
                                                        {entry.expectedRating ? entry.expectedRating.toFixed(1) : "-"}
                                                    </span>
                                                    {entry.expectedNote && (
                                                        <span className="text-xs text-white/60">
                                                            ({entry.expectedNote})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] uppercase tracking-wider text-white/40">
                                                    Actually
                                                </p>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <RatingStars
                                                        value={entry.actualRating ?? 0}
                                                        readOnly={true}
                                                        step={0.5}
                                                        size="sm"
                                                        label="Actual rating"
                                                    />
                                                    <span className="text-xs text-amber-300">
                                                        {entry.actualRating ? entry.actualRating.toFixed(1) : "-"}
                                                    </span>
                                                    {entry.actualNote && (
                                                        <span className="text-xs text-white/60">
                                                            ({entry.actualNote})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {(entry.rewatchability || entry.rewatchabilityWhy) && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Rewatchability
                                        </p>
                                        <p className="mt-1 text-white">
                                            {(() => {
                                                const labelMap: Record<string, string> = {
                                                    one_time: "❄️ One time",
                                                    maybe: "Maybe",
                                                    definitely: "Definitely",
                                                    infinite: "♾️ Infinite",
                                                }
                                                return entry.rewatchability
                                                    ? labelMap[entry.rewatchability] || entry.rewatchability
                                                    : "-"
                                            })()}
                                        </p>
                                        {entry.rewatchabilityWhy && (
                                            <p className="mt-2 text-sm text-white/60">
                                                {entry.rewatchabilityWhy}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {entry.companions && entry.companions.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Watched with
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {entry.companions.map((username, index) => (
                                                <Link
                                                    key={`${username}-${index}`}
                                                    to={`/users/${username}`}
                                                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-amber-200/90 transition hover:border-amber-400/40 hover:text-amber-200"
                                                >
                                                    @{username}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {entry.notes && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Notes
                                        </p>
                                        <p className="mt-1 whitespace-pre-line text-white/80">
                                            {entry.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
