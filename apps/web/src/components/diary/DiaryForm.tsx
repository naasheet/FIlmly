import { useEffect, useState } from "react"
import { X, MapPin, Tv, Users, RotateCcw, Link2, Calendar } from "lucide-react"
import RatingStars from "../ui/RatingStars"
import { MOOD_LIST } from "../../constants/moods"
import api from "../../services/api"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DiaryFormValues = {
    watchedDate: string
    mood: string | null
    rating: number | null
    location: string | null
    venue: string | null
    format: string | null
    vibes: string[]
    companions: string[]
    notes: string | null
    isPrivate: boolean
    wouldRewatch: boolean
    linkToReview: boolean
}

type DiaryFormProps = {
    filmId: number
    filmTitle: string
    filmPosterPath?: string | null
    initialValues?: Partial<DiaryFormValues>
    lockRating?: boolean
    onSubmit: (values: DiaryFormValues) => Promise<void> | void
    onCancel?: () => void
    submitLabel?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LOCATIONS = [
    { value: "home", label: "🏠 Home" },
    { value: "cinema", label: "🎬 Cinema" },
    { value: "friends", label: "👥 Friend's Place" },
    { value: "outdoor", label: "🌳 Outdoor" },
    { value: "travel", label: "✈️ Travel" },
    { value: "other", label: "📍 Other" },
]

const FORMATS = [
    { value: "streaming", label: "📺 Streaming" },
    { value: "bluray", label: "💿 Blu-ray" },
    { value: "4k", label: "📀 4K UHD" },
    { value: "dvd", label: "📀 DVD" },
    { value: "imax", label: "🎭 IMAX" },
    { value: "35mm", label: "🎞️ 35mm" },
    { value: "digital", label: "🖥️ Digital" },
]

const SUGGESTED_VIBES = [
    "cozy", "date night", "solo", "marathon", "late night",
    "weekend", "comfort watch", "first time", "double feature"
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DiaryForm({
    filmTitle,
    filmPosterPath,
    initialValues,
    lockRating = false,
    onSubmit,
    onCancel,
    submitLabel = "Save Entry",
}: DiaryFormProps) {
    const today = new Date().toISOString().split("T")[0]

    const [watchedDate, setWatchedDate] = useState(initialValues?.watchedDate ?? today)
    const [mood, setMood] = useState<string | null>(initialValues?.mood ?? null)
    const [rating, setRating] = useState<number | null>(initialValues?.rating ?? null)
    const [location, setLocation] = useState<string | null>(initialValues?.location ?? null)
    const [venue, setVenue] = useState(initialValues?.venue ?? "")
    const [format, setFormat] = useState<string | null>(initialValues?.format ?? null)
    const [vibes, setVibes] = useState<string[]>(initialValues?.vibes ?? [])
    const [vibeInput, setVibeInput] = useState("")
    const [companions, setCompanions] = useState<string[]>(initialValues?.companions ?? [])
    const [companionInput, setCompanionInput] = useState("")
    const [userSuggestions, setUserSuggestions] = useState<Array<{ username: string; name?: string | null; avatarUrl?: string | null }>>([])
    const [loadingSuggestions, setLoadingSuggestions] = useState(false)
    const [notes, setNotes] = useState(initialValues?.notes ?? "")
    const [moodInput, setMoodInput] = useState("")
    const [isPrivate, setIsPrivate] = useState(initialValues?.isPrivate ?? false)
    const [wouldRewatch, setWouldRewatch] = useState(initialValues?.wouldRewatch ?? false)
    const [linkToReview, setLinkToReview] = useState(initialValues?.linkToReview ?? false)

    useEffect(() => {
        if (!initialValues) return
        if (initialValues.watchedDate) setWatchedDate(initialValues.watchedDate)
        if (initialValues.mood !== undefined) setMood(initialValues.mood ?? null)
        if (initialValues.rating !== undefined) setRating(initialValues.rating ?? null)
        if (initialValues.location !== undefined) setLocation(initialValues.location ?? null)
        if (initialValues.venue !== undefined) setVenue(initialValues.venue ?? "")
        if (initialValues.format !== undefined) setFormat(initialValues.format ?? null)
        if (initialValues.vibes !== undefined) setVibes(initialValues.vibes ?? [])
        if (initialValues.companions !== undefined) setCompanions(initialValues.companions ?? [])
        if (initialValues.notes !== undefined) setNotes(initialValues.notes ?? "")
        if (initialValues.isPrivate !== undefined) setIsPrivate(Boolean(initialValues.isPrivate))
        if (initialValues.wouldRewatch !== undefined) setWouldRewatch(Boolean(initialValues.wouldRewatch))
        if (initialValues.linkToReview !== undefined) setLinkToReview(Boolean(initialValues.linkToReview))
    }, [initialValues?.rating, initialValues?.watchedDate, initialValues?.mood, initialValues?.location, initialValues?.venue, initialValues?.format, initialValues?.vibes, initialValues?.companions, initialValues?.notes, initialValues?.isPrivate, initialValues?.wouldRewatch, initialValues?.linkToReview])

    useEffect(() => {
        const query = companionInput.trim().replace(/^@/, "")
        if (!query) {
            setUserSuggestions([])
            return
        }
        let active = true
        setLoadingSuggestions(true)
        const handle = window.setTimeout(async () => {
            try {
                const res = await api.get("/users/search", { params: { query } })
                const results = (res.data?.results ?? res.data ?? []).map((user: any) => ({
                    username: user.username,
                    name: user.name ?? null,
                    avatarUrl: user.avatarUrl ?? null,
                }))
                if (active) setUserSuggestions(results)
            } catch {
                if (active) setUserSuggestions([])
            } finally {
                if (active) setLoadingSuggestions(false)
            }
        }, 250)
        return () => {
            active = false
            window.clearTimeout(handle)
        }
    }, [companionInput])

    const [error, setError] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // ─────────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────────

    const addVibe = (vibe: string) => {
        const trimmed = vibe.trim().toLowerCase()
        if (trimmed && !vibes.includes(trimmed)) {
            setVibes([...vibes, trimmed])
        }
        setVibeInput("")
    }

    const removeVibe = (vibe: string) => {
        setVibes(vibes.filter((v) => v !== vibe))
    }

    const addCompanion = (name: string) => {
        const trimmed = name.trim().replace(/^@/, "")
        if (trimmed && !companions.includes(trimmed)) {
            setCompanions([...companions, trimmed])
        }
        setCompanionInput("")
        setUserSuggestions([])
    }

    const removeCompanion = (name: string) => {
        setCompanions(companions.filter((c) => c !== name))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)

        if (!watchedDate) {
            setError("Please select when you watched this film.")
            return
        }

        setSubmitting(true)
        try {
            await onSubmit({
                watchedDate,
                mood,
                rating,
                location,
                venue: venue.trim() || null,
                format,
                vibes,
                companions,
                notes: notes.trim() || null,
                isPrivate,
                wouldRewatch,
                linkToReview,
            })
        } catch (err: any) {
            setError(err?.message ?? "Unable to save diary entry.")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
            {/* Film Title Header */}
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <div className="h-20 w-14 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {filmPosterPath ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w185${filmPosterPath}`}
                            alt={filmTitle}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                            —
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                        Logging
                    </p>
                    <h2 className="font-['Outfit'] text-xl font-bold text-white">{filmTitle}</h2>
                </div>
            </div>

            {/* Date & Rating Row */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Watched Date */}
                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                        <Calendar className="h-4 w-4" />
                        Watched Date
                    </label>
                    <input
                        type="date"
                        value={watchedDate}
                        onChange={(e) => setWatchedDate(e.target.value)}
                        max={today}
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-400/50"
                    />
                </div>

                {/* Rating */}
                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Rating (optional)
                    </label>
                    <div
                        className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 ${
                            lockRating ? "cursor-not-allowed opacity-70" : ""
                        }`}
                        aria-disabled={lockRating || submitting}
                    >
                        <RatingStars
                            value={rating ?? 0}
                            onChange={setRating}
                            readOnly={submitting || lockRating}
                            step={0.5}
                            size="sm"
                            label="Diary rating"
                        />
                        <span className="text-sm text-amber-400">
                            {rating ? rating.toFixed(1) : "—"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Mood Selector */}
            <div>
                <label className="mb-3 block text-sm font-medium text-white/70">
                    How did it make you feel?
                </label>
                <div className="flex flex-wrap gap-2">
                    {MOOD_LIST.map((m) => {
                        const isSelected = mood === m.id
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMood(isSelected ? null : m.id)}
                                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isSelected
                                        ? `${m.bgColor} ${m.borderColor} ${m.color}`
                                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                                    }`}
                            >
                                {m.emoji} {m.label}
                            </button>
                        )
                    })}
                </div>
                <div className="mt-3 flex gap-2">
                    <input
                        type="text"
                        value={moodInput}
                        onChange={(e) => setMoodInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                const trimmed = moodInput.trim()
                                if (trimmed) {
                                    setMood(trimmed)
                                    setMoodInput("")
                                }
                            }
                        }}
                        placeholder="Add your own mood..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            const trimmed = moodInput.trim()
                            if (trimmed) {
                                setMood(trimmed)
                                setMoodInput("")
                            }
                        }}
                        disabled={!moodInput.trim()}
                        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Location & Format Row */}
            <div className="grid gap-4 sm:grid-cols-2">
                {/* Location */}
                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                        <MapPin className="h-4 w-4" />
                        Where did you watch?
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {LOCATIONS.map((loc) => (
                            <button
                                key={loc.value}
                                type="button"
                                onClick={() => setLocation(location === loc.value ? null : loc.value)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${location === loc.value
                                        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                                    }`}
                            >
                                {loc.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Format */}
                <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                        <Tv className="h-4 w-4" />
                        Format
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FORMATS.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFormat(format === f.value ? null : f.value)}
                                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${format === f.value
                                        ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                                    }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Venue (when cinema selected) */}
            {location === "cinema" && (
                <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">
                        Cinema/Theater Name
                    </label>
                    <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g., AMC Lincoln Square"
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50"
                    />
                </div>
            )}

            {/* Vibes Tags */}
            <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                    Vibes / Tags
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                    {vibes.map((vibe) => (
                        <span
                            key={vibe}
                            className="inline-flex items-center gap-1 rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-medium text-violet-300"
                        >
                            {vibe}
                            <button
                                type="button"
                                onClick={() => removeVibe(vibe)}
                                className="ml-1 text-violet-400 hover:text-violet-200"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={vibeInput}
                        onChange={(e) => setVibeInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                addVibe(vibeInput)
                            }
                        }}
                        placeholder="Add a vibe..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50"
                    />
                    <button
                        type="button"
                        onClick={() => addVibe(vibeInput)}
                        disabled={!vibeInput.trim()}
                        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                    {SUGGESTED_VIBES.filter((v) => !vibes.includes(v)).slice(0, 5).map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => addVibe(v)}
                            className="rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
                        >
                            +{v}
                        </button>
                    ))}
                </div>
            </div>

            {/* Watched With (Companions) */}
            <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Users className="h-4 w-4" />
                    Watched With
                    <span className="text-xs text-white/40">(private)</span>
                </label>
                <div className="mb-2 flex flex-wrap gap-2">
                    {companions.map((name) => (
                        <span
                            key={name}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
                        >
                            {name}
                            <button
                                type="button"
                                onClick={() => removeCompanion(name)}
                                className="ml-1 text-emerald-400 hover:text-emerald-200"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={companionInput}
                        onChange={(e) => setCompanionInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                addCompanion(companionInput)
                            }
                        }}
                        placeholder="Add a name or @username..."
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50"
                    />
                    <button
                        type="button"
                        onClick={() => addCompanion(companionInput)}
                        disabled={!companionInput.trim()}
                        className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
                    >
                        Add
                    </button>
                </div>
                {(companionInput.trim() || loadingSuggestions) && userSuggestions.length > 0 && (
                    <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-white/10 bg-black/60 p-2">
                        {userSuggestions.map((user) => (
                            <button
                                key={user.username}
                                type="button"
                                onClick={() => addCompanion(user.username)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
                            >
                                <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/5">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.username}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                                            {user.username.slice(0, 1).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">@{user.username}</span>
                                    {user.name && (
                                        <span className="text-xs text-white/40">{user.name}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes */}
            <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                    Personal Notes
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    placeholder="How was the experience? Any memorable moments?"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50"
                />
            </div>

            {/* Toggles Row */}
            <div className="grid gap-3 sm:grid-cols-3">
                {/* Would Rewatch */}
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                        <RotateCcw className="h-4 w-4" />
                        Would Rewatch
                    </span>
                    <span className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={wouldRewatch}
                            onChange={(e) => setWouldRewatch(e.target.checked)}
                            className="peer sr-only"
                        />
                        <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-amber-500/70" />
                        <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
                    </span>
                </label>

                {/* Private Entry */}
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="text-sm text-white/70">Private Entry</span>
                    <span className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={(e) => setIsPrivate(e.target.checked)}
                            className="peer sr-only"
                        />
                        <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-rose-500/70" />
                        <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
                    </span>
                </label>

                {/* Link to Review */}
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-white/70">
                        <Link2 className="h-4 w-4" />
                        Link to Review
                    </span>
                    <span className="relative inline-flex items-center">
                        <input
                            type="checkbox"
                            checked={linkToReview}
                            onChange={(e) => setLinkToReview(e.target.checked)}
                            className="peer sr-only"
                        />
                        <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-indigo-500/70" />
                        <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
                    </span>
                </label>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {submitting ? "Saving..." : submitLabel}
                </button>
            </div>
        </form>
    )
}
