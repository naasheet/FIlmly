import { useState, useEffect } from "react"
import { useParams, useSearchParams, useNavigate, useLocation, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
    Calendar,
    List,
    Filter,
    ChevronLeft,
    ChevronRight,
    Book,
} from "lucide-react"
import Header from "../../components/layout/Header"
import DiaryEntry, { DiaryDay, type DiaryEntryData } from "../../components/diary/DiaryEntry"
import DiaryForm from "../../components/diary/DiaryForm"
import {
    getUserDiary,
    getUserDiaryCalendar,
    getUserDiaryStats,
    createDiaryEntry,
    deleteDiaryEntry,
    type DiaryListParams,
} from "../../services/diaryService"
import { useAuthStore } from "../../stores/authStore"
import api, { normalizeApiError } from "../../services/api"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ViewMode = "list" | "calendar"

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DiaryPage() {
    const { username } = useParams<{ username: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const { user, accessToken } = useAuthStore()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const location = useLocation()

    // Use current user's username if not provided
    const targetUsername = username || user?.username
    const isOwnDiary = targetUsername === user?.username

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>("list")
    const [showFilters, setShowFilters] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [createError, setCreateError] = useState<string | null>(null)
    const [selectedFilm, setSelectedFilm] = useState<{ id: number; title: string; posterPath?: string | null } | null>(null)
    const [filmQuery, setFilmQuery] = useState("")
    const [filmResults, setFilmResults] = useState<
        Array<{ id: number; title: string; releaseDate?: string | null; posterPath?: string | null }>
    >([])
    const [filmSearching, setFilmSearching] = useState(false)
    const [selectedFilmRating, setSelectedFilmRating] = useState<number | null>(null)
    const [ratingLocked, setRatingLocked] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<DiaryEntryData | null>(null)
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [selectedDateEntries, setSelectedDateEntries] = useState<
        Array<{ id: string; filmId: number; filmTitle: string; filmPoster: string | null; mood: string | null; rating: number | null }>
    >([])

    // Calendar state
    const now = new Date()
    const [calendarYear, setCalendarYear] = useState(now.getFullYear())
    const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1)

    // Filters
    const [filters, setFilters] = useState<DiaryListParams>({
        page: 1,
        pageSize: 20,
        sortBy: "newest",
        location: searchParams.get("location") || undefined,
        format: searchParams.get("format") || undefined,
        year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
    })

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.location) params.set("location", filters.location)
        if (filters.format) params.set("format", filters.format)
        if (filters.year) params.set("year", String(filters.year))
        setSearchParams(params, { replace: true })
    }, [filters.location, filters.format, filters.year])

    useEffect(() => {
        if (!showCreate) {
            setFilmQuery("")
            setFilmResults([])
            setSelectedFilm(null)
            setSelectedFilmRating(null)
            setRatingLocked(false)
            setCreateError(null)
        }
    }, [showCreate])

    useEffect(() => {
        if (!showCreate || !filmQuery.trim()) {
            setFilmResults([])
            return
        }
        let active = true
        setFilmSearching(true)
        const handle = window.setTimeout(async () => {
            try {
                const res = await api.get("/films/search", {
                    params: { query: filmQuery.trim(), page: 1 },
                })
                if (!active) return
                const results = (res.data?.results ?? []).map((item: any) => ({
                    id: item.film.id,
                    title: item.film.title,
                    releaseDate: item.film.releaseDate,
                    posterPath: item.film.posterPath ?? null,
                }))
                setFilmResults(results)
            } catch (err) {
                if (!active) return
                setCreateError(normalizeApiError(err))
            } finally {
                if (active) setFilmSearching(false)
            }
        }, 350)
        return () => {
            active = false
            window.clearTimeout(handle)
        }
    }, [filmQuery, showCreate])

    // ─────────────────────────────────────────────────────────────────────────────
    // Queries
    // ─────────────────────────────────────────────────────────────────────────────

    const {
        data: diaryData,
        isLoading: isLoadingDiary,
        error: diaryError,
        refetch: refetchDiary,
    } = useQuery({
        queryKey: ["diary", targetUsername, filters],
        queryFn: () => getUserDiary(targetUsername!, filters),
        enabled: !!targetUsername && viewMode === "list",
    })

    const {
        data: calendarData,
        isLoading: isLoadingCalendar,
    } = useQuery({
        queryKey: ["diary-calendar", targetUsername, calendarYear, calendarMonth],
        queryFn: () => getUserDiaryCalendar(targetUsername!, calendarYear, calendarMonth),
        enabled: !!targetUsername && viewMode === "calendar",
    })

    const { data: statsData } = useQuery({
        queryKey: ["diary-stats", targetUsername],
        queryFn: () => getUserDiaryStats(targetUsername!),
        enabled: !!targetUsername,
    })

    const handleDeleteEntry = async (entryId: string) => {
        if (!accessToken) {
            const next = encodeURIComponent(location.pathname + location.search)
            navigate(`/login?next=${next}`)
            return
        }
        try {
            await deleteDiaryEntry(entryId)
            await Promise.all([
                refetchDiary(),
                queryClient.invalidateQueries({
                    queryKey: ["diary-stats", targetUsername],
                }),
                queryClient.invalidateQueries({
                    queryKey: ["diary-calendar", targetUsername],
                }),
            ])
        } catch (err: any) {
            setCreateError(err?.message ?? "Unable to delete diary entry.")
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Calendar Helpers
    // ─────────────────────────────────────────────────────────────────────────────

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate()
    }

    const getFirstDayOfMonth = (year: number, month: number) => {
        return new Date(year, month - 1, 1).getDay()
    }

    const goToPrevMonth = () => {
        if (calendarMonth === 1) {
            setCalendarMonth(12)
            setCalendarYear(calendarYear - 1)
        } else {
            setCalendarMonth(calendarMonth - 1)
        }
    }

    const goToNextMonth = () => {
        if (calendarMonth === 12) {
            setCalendarMonth(1)
            setCalendarYear(calendarYear + 1)
        } else {
            setCalendarMonth(calendarMonth + 1)
        }
    }

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(calendarYear, calendarMonth)
        const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth)
        const days = []

        // Empty cells for days before the first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-20" />)
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const entries = calendarData?.calendar[dateStr] || []

            days.push(
                <DiaryDay
                    key={dateStr}
                    date={dateStr}
                    entries={entries}
                    onSelect={(date, dayEntries) => {
                        setSelectedDate(date)
                        setSelectedDateEntries(dayEntries)
                    }}
                />
            )
        }

        return days
    }

    const formatLabel = (value?: string | null) => {
        if (!value) return ""
        return value.charAt(0).toUpperCase() + value.slice(1)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────────

    if (!targetUsername) {
        return (
            <div className="min-h-screen bg-black">
                <Header />
                <main className="mx-auto max-w-5xl px-4 py-8">
                    <p className="text-white/50">Please log in to view your diary.</p>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black">
            <Header />

            <main className="mx-auto max-w-6xl px-4 py-8">
                {/* Page Header */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-['Outfit'] text-3xl font-bold text-white">
                            <Book className="mr-2 inline-block h-8 w-8 text-amber-400" />
                            {isOwnDiary ? "My Diary" : `${targetUsername}'s Diary`}
                        </h1>
                        <p className="mt-1 text-white/50">
                            {statsData?.totalEntries ?? 0} entries logged
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        {isOwnDiary && (
                            <button
                                onClick={() => {
                                    if (!accessToken) {
                                        const next = encodeURIComponent(location.pathname + location.search)
                                        navigate(`/login?next=${next}`)
                                        return
                                    }
                                    setShowCreate(true)
                                }}
                                className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400/60 hover:text-amber-100"
                            >
                                Create entry
                            </button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${showFilters
                                ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
                                : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                                }`}
                        >
                            <Filter className="h-4 w-4" />
                            Filters
                        </button>

                        <div className="flex rounded-lg border border-white/10 bg-white/5 p-1">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${viewMode === "list"
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white/70"
                                    }`}
                            >
                                <List className="h-4 w-4" />
                                List
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${viewMode === "calendar"
                                    ? "bg-white/10 text-white"
                                    : "text-white/50 hover:text-white/70"
                                    }`}
                            >
                                <Calendar className="h-4 w-4" />
                                Calendar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                {statsData && (
                    <div
                        className={`mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-${
                            Object.keys(statsData.formatDistribution).length > 0 ? "4" : "3"
                        }`}
                    >
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Entries
                            </p>
                            <p className="mt-1 text-2xl font-bold text-white">
                                {statsData.totalEntries}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Avg Rating
                            </p>
                            <p className="mt-1 text-2xl font-bold text-amber-400">
                                {statsData.averageRating?.toFixed(1) ?? "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                                Top Location
                            </p>
                            <div className="mt-1 text-lg font-medium text-white/70">
                                {(() => {
                                    const top = Object.entries(statsData.locationDistribution)
                                        .sort((a, b) => b[1] - a[1])[0]?.[0]
                                    return top ? formatLabel(top) : "—"
                                })()}
                            </div>
                        </div>
                        {Object.keys(statsData.formatDistribution).length > 0 && (
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                                    Top Format
                                </p>
                                <p className="mt-1 text-lg font-medium text-white/70">
                                    {Object.entries(statsData.formatDistribution)
                                        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <div className="grid gap-4 sm:grid-cols-3">
                            {/* Location Filter */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/70">
                                    Location
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: "home", label: "Home" },
                                        { id: "cinema", label: "Cinema" },
                                        { id: "friends", label: "Friend's" },
                                        { id: "outdoor", label: "Outdoor" },
                                        { id: "travel", label: "Travel" },
                                        { id: "other", label: "Other" },
                                    ].map((loc) => (
                                        <button
                                            key={loc.id}
                                            onClick={() =>
                                                setFilters({
                                                    ...filters,
                                                    location: filters.location === loc.id ? undefined : loc.id,
                                                    page: 1,
                                                })
                                            }
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${filters.location === loc.id
                                                ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                                                : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                                                }`}
                                        >
                                            {loc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-white/70">
                                    Sort By
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: "newest", label: "Newest" },
                                        { id: "oldest", label: "Oldest" },
                                    ].map((option) => (
                                        <button
                                            key={option.id}
                                            onClick={() =>
                                                setFilters({
                                                    ...filters,
                                                    sortBy: option.id as "newest" | "oldest",
                                                    page: 1,
                                                })
                                            }
                                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                                filters.sortBy === option.id
                                                    ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                                                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Clear Filters */}
                            <div className="flex items-end">
                                <button
                                    onClick={() =>
                                        setFilters({
                                            page: 1,
                                            pageSize: 20,
                                            sortBy: "newest",
                                        })
                                    }
                                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {viewMode === "list" ? (
                    // List View
                    <div className="space-y-4">
                        {isLoadingDiary ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-32 animate-pulse rounded-2xl bg-white/5"
                                    />
                                ))}
                            </div>
                        ) : diaryError ? (
                            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center text-rose-200">
                                Failed to load diary entries
                            </div>
                        ) : !diaryData?.results.length ? (
                            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
                                <Book className="mx-auto h-12 w-12 text-white/20" />
                                <h3 className="mt-4 font-['Outfit'] text-xl font-semibold text-white/70">
                                    No entries yet
                                </h3>
                                <p className="mt-2 text-sm text-white/50">
                                    {isOwnDiary
                                        ? "Start logging your film experiences!"
                                        : "This user hasn't logged any films yet."}
                                </p>
                            </div>
                        ) : (
                            <>
                                {diaryData.results.map((entry) => (
                                    <DiaryEntry
                                        key={entry.id}
                                        entry={entry}
                                        canDelete={isOwnDiary}
                                        onDelete={(entryId) => setDeleteTargetId(entryId)}
                                        onOpen={(entry) => setSelectedEntry(entry)}
                                    />
                                ))}

                                {/* Pagination */}
                                {diaryData.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-4">
                                        <button
                                            onClick={() =>
                                                setFilters({ ...filters, page: (filters.page ?? 1) - 1 })
                                            }
                                            disabled={diaryData.page === 1}
                                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-30"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-white/50">
                                            Page {diaryData.page} of {diaryData.totalPages}
                                        </span>
                                        <button
                                            onClick={() =>
                                                setFilters({ ...filters, page: (filters.page ?? 1) + 1 })
                                            }
                                            disabled={diaryData.page === diaryData.totalPages}
                                            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-30"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    // Calendar View
                    <div>
                        {/* Month Navigation */}
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                onClick={goToPrevMonth}
                                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Prev
                            </button>

                            <h2 className="font-['Outfit'] text-xl font-semibold text-white">
                                {MONTHS[calendarMonth - 1]} {calendarYear}
                            </h2>

                            <button
                                onClick={goToNextMonth}
                                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:bg-white/10"
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                            {/* Weekday Headers */}
                            <div className="mb-2 grid grid-cols-7 gap-2">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                                    <div
                                        key={day}
                                        className="text-center text-xs font-medium uppercase tracking-wider text-white/40"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid */}
                            {isLoadingCalendar ? (
                                <div className="grid grid-cols-7 gap-2">
                                    {[...Array(35)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-20 animate-pulse rounded-lg bg-white/5"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-7 gap-2">{renderCalendar()}</div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {showCreate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setShowCreate(false)}
                >
                    <div
                        className="w-full max-h-[90vh] max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                    New Diary Entry
                                </p>
                                <h3 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
                                    {selectedFilm ? selectedFilm.title : "Choose a film"}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        {!selectedFilm && (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={filmQuery}
                                    onChange={(event) => setFilmQuery(event.target.value)}
                                    placeholder="Search for a film..."
                                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400/50 focus:outline-none"
                                />
                                {filmSearching && (
                                    <p className="text-sm text-slate-400">Searching…</p>
                                )}
                                {createError && (
                                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                                        {createError}
                                    </div>
                                )}
                                <div className="max-h-64 space-y-2 overflow-auto">
                                    {filmResults.map((film) => (
                                        <button
                                            key={film.id}
                                            type="button"
                                            onClick={async () => {
                                                setSelectedFilm({ id: film.id, title: film.title, posterPath: film.posterPath ?? null })
                                                setSelectedFilmRating(null)
                                                setRatingLocked(false)
                                                try {
                                                    const ratingRes = await api.get(`/ratings/film/${film.id}`)
                                                    const ratingValue = ratingRes.data?.rating ?? null
                                                    if (ratingValue !== null) {
                                                        setSelectedFilmRating(ratingValue)
                                                        setRatingLocked(true)
                                                        return
                                                    }
                                                    const reviewsRes = await api.get("/reviews/me")
                                                    const reviewMatch = (reviewsRes.data ?? []).find(
                                                        (review: any) => review.film?.id === film.id,
                                                    )
                                                    if (reviewMatch?.rating !== undefined) {
                                                        setSelectedFilmRating(reviewMatch?.rating ?? null)
                                                        setRatingLocked(true)
                                                    } else {
                                                        setSelectedFilmRating(null)
                                                    }
                                                } catch {
                                                    setSelectedFilmRating(null)
                                                }
                                            }}
                                            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:border-white/30 hover:bg-white/10"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-8 overflow-hidden rounded-lg border border-white/10 bg-slate-900/70">
                                                    {film.posterPath ? (
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w92${film.posterPath}`}
                                                            alt={film.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                                                            —
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-semibold">{film.title}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {film.releaseDate
                                                    ? new Date(film.releaseDate).getFullYear()
                                                    : "—"}
                                            </span>
                                        </button>
                                    ))}
                                    {!filmSearching && filmQuery.trim() && filmResults.length === 0 && (
                                        <p className="text-sm text-slate-400">No films found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedFilm && (
                            <DiaryForm
                                filmId={selectedFilm.id}
                                filmTitle={selectedFilm.title}
                                filmPosterPath={selectedFilm.posterPath ?? null}
                                initialValues={{
                                    rating: selectedFilmRating ?? undefined,
                                }}
                                lockRating={ratingLocked}
                                onSubmit={async (values) => {
                                    setCreateError(null)
                                    if (!accessToken) {
                                        const next = encodeURIComponent(location.pathname + location.search)
                                        navigate(`/login?next=${next}`)
                                        return
                                    }
                                    try {
                                        await createDiaryEntry({
                                            filmId: selectedFilm.id,
                                            watchedDate: values.watchedDate,
                                            mood: values.mood,
                                            rating: values.rating,
                                            location: values.location,
                                            venue: values.venue,
                                            format: values.format,
                                            vibes: values.vibes,
                                            companions: values.companions,
                                            notes: values.notes,
                                            isPrivate: values.isPrivate,
                                            linkToReview: values.linkToReview,
                                        })
                                        setShowCreate(false)
                                        await Promise.all([
                                            refetchDiary(),
                                            queryClient.invalidateQueries({
                                                queryKey: ["diary-stats", targetUsername],
                                            }),
                                            queryClient.invalidateQueries({
                                                queryKey: ["diary-calendar", targetUsername],
                                            }),
                                        ])
                                    } catch (err: any) {
                                        setCreateError(err?.message ?? "Unable to save diary entry.")
                                    }
                                }}
                                onCancel={() => setSelectedFilm(null)}
                            />
                        )}
                    </div>
                </div>
            )}

            {deleteTargetId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setDeleteTargetId(null)}
                >
                    <div
                        className="w-full max-w-md rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h3 className="font-['Outfit'] text-xl font-semibold text-white">
                            Delete diary entry?
                        </h3>
                        <p className="mt-2 text-sm text-white/60">
                            This action cannot be undone.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteTargetId(null)}
                                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    const entryId = deleteTargetId
                                    setDeleteTargetId(null)
                                    if (entryId) await handleDeleteEntry(entryId)
                                }}
                                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
                            >
                                Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedEntry && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedEntry(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                    Diary Entry
                                </p>
                                <h3 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
                                    {selectedEntry.film.title}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedEntry(null)}
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 sm:grid-cols-[140px_1fr]">
                            <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                                {selectedEntry.film.posterPath ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w342${selectedEntry.film.posterPath}`}
                                        alt={selectedEntry.film.title}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
                                        No poster
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 text-sm text-white/70">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-white/40">
                                        Watched date
                                    </p>
                                    <p className="mt-1 text-white">
                                        {new Date(selectedEntry.watchedDate).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            month: "long",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>

                                {selectedEntry.rating !== null && selectedEntry.rating !== undefined && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Rating
                                        </p>
                                        <p className="mt-1 text-amber-300">{selectedEntry.rating.toFixed(1)}</p>
                                    </div>
                                )}

                                {selectedEntry.mood && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Mood
                                        </p>
                                        <p className="mt-1 text-white">{formatLabel(selectedEntry.mood)}</p>
                                    </div>
                                )}

                                {(selectedEntry.location || selectedEntry.venue) && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Location
                                        </p>
                                        <p className="mt-1 text-white">
                                            {selectedEntry.venue ?? formatLabel(selectedEntry.location ?? "")}
                                        </p>
                                    </div>
                                )}

                                {selectedEntry.format && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Format
                                        </p>
                                        <p className="mt-1 text-white">{selectedEntry.format}</p>
                                    </div>
                                )}

                                {selectedEntry.companions && selectedEntry.companions.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Watched with
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {selectedEntry.companions.map((username, index) => (
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

                                {selectedEntry.vibes && selectedEntry.vibes.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Vibes
                                        </p>
                                        <p className="mt-1 text-white">
                                            {selectedEntry.vibes.join(", ")}
                                        </p>
                                    </div>
                                )}

                                {selectedEntry.notes && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-white/40">
                                            Notes
                                        </p>
                                        <p className="mt-1 whitespace-pre-line text-white/80">
                                            {selectedEntry.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedDate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedDate(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                                    Diary Calendar
                                </p>
                                <h3 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
                                    {new Date(selectedDate).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDate(null)}
                                className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
                            >
                                Close
                            </button>
                        </div>

                        <div className="mt-6 space-y-3">
                            {selectedDateEntries.map((entry) => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    onClick={() => navigate(`/diary/${entry.id}`)}
                                    className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-amber-400/30 hover:bg-white/[0.06]"
                                >
                                    <div className="h-14 w-10 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                                        {entry.filmPoster ? (
                                            <img
                                                src={`https://image.tmdb.org/t/p/w92${entry.filmPoster}`}
                                                alt={entry.filmTitle}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                                                —
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-white">
                                            {entry.filmTitle}
                                        </p>
                                        {entry.mood && (
                                            <p className="text-xs text-white/50">Mood: {entry.mood}</p>
                                        )}
                                    </div>
                                    {entry.rating !== null && entry.rating !== undefined && (
                                        <div className="text-sm font-semibold text-amber-300">
                                            {entry.rating.toFixed(1)}
                                        </div>
                                    )}
                                </button>
                            ))}
                            {selectedDateEntries.length === 0 && (
                                <p className="text-sm text-white/50">No entries for this date.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
