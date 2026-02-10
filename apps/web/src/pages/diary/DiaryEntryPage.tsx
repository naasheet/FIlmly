import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import Header from "../../components/layout/Header"
import { getDiaryEntry } from "../../services/diaryService"
import { resolvePosterUrl } from "../../utils/image"

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
    rating?: number | null
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
                                    <p className="mt-1 text-sm text-white/50">
                                        Watched on{" "}
                                        {new Date(entry.watchedDate).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {entry.rating !== null && entry.rating !== undefined && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-white/40">
                                                Rating
                                            </p>
                                            <p className="mt-1 text-amber-300">
                                                {entry.rating.toFixed(1)}
                                            </p>
                                        </div>
                                    )}
                                    {entry.mood && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-white/40">
                                                Mood
                                            </p>
                                            <p className="mt-1 text-white">{formatLabel(entry.mood)}</p>
                                        </div>
                                    )}
                                    {(entry.location || entry.venue) && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-white/40">
                                                Location
                                            </p>
                                            <p className="mt-1 text-white">
                                                {entry.venue ?? formatLabel(entry.location ?? "")}
                                            </p>
                                        </div>
                                    )}
                                    {entry.format && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-white/40">
                                                Format
                                            </p>
                                            <p className="mt-1 text-white">{entry.format}</p>
                                        </div>
                                    )}
                                </div>

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

                                {entry.vibes && entry.vibes.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Vibes
                                        </p>
                                        <p className="mt-1 text-white">
                                            {entry.vibes.join(", ")}
                                        </p>
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
