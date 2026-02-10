import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import { ChevronLeft, ChevronRight, Film } from "lucide-react"
import { MoodBadge } from "./MoodSelector"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CalendarEntry = {
    id: string
    filmId: number
    filmTitle: string
    filmPoster: string | null
    mood: string | null
    rating: number | null
}

export type CalendarData = Record<string, CalendarEntry[]>

type DiaryCalendarProps = {
    data: CalendarData
    year: number
    month: number
    onMonthChange: (year: number, month: number) => void
    onDayClick?: (date: string, entries: CalendarEntry[]) => void
    loading?: boolean
    username?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function DiaryCalendar({
    data,
    year,
    month,
    onMonthChange,
    onDayClick,
    loading = false,
    username,
}: DiaryCalendarProps) {
    const [hoveredDay, setHoveredDay] = useState<string | null>(null)

    // ─────────────────────────────────────────────────────────────────────────────
    // Calendar Calculations
    // ─────────────────────────────────────────────────────────────────────────────

    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate()
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
        const days: Array<{ date: string; day: number } | null> = []

        // Empty cells before the first day
        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null)
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            days.push({ date, day })
        }

        return days
    }, [year, month])

    const isToday = (dateStr: string) => {
        const today = new Date().toISOString().split("T")[0]
        return dateStr === today
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Navigation
    // ─────────────────────────────────────────────────────────────────────────────

    const goToPrevMonth = () => {
        if (month === 1) {
            onMonthChange(year - 1, 12)
        } else {
            onMonthChange(year, month - 1)
        }
    }

    const goToNextMonth = () => {
        if (month === 12) {
            onMonthChange(year + 1, 1)
        } else {
            onMonthChange(year, month + 1)
        }
    }

    const goToToday = () => {
        const now = new Date()
        onMonthChange(now.getFullYear(), now.getMonth() + 1)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────────

    return (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <button
                    onClick={goToPrevMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">
                    <h2 className="font-['Outfit'] text-xl font-semibold text-white">
                        {MONTHS[month - 1]} {year}
                    </h2>
                    <button
                        onClick={goToToday}
                        className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20"
                    >
                        Today
                    </button>
                </div>

                <button
                    onClick={goToNextMonth}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                    aria-label="Next month"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="py-2 text-center text-xs font-semibold uppercase tracking-wider text-white/40"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            {loading ? (
                <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square animate-pulse rounded-lg bg-white/5"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((dayInfo, idx) => {
                        if (!dayInfo) {
                            return <div key={`empty-${idx}`} className="aspect-square" />
                        }

                        const entries = data[dayInfo.date] || []
                        const hasEntries = entries.length > 0
                        const isHovered = hoveredDay === dayInfo.date
                        const todayClass = isToday(dayInfo.date)
                            ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-black"
                            : ""

                        return (
                            <div
                                key={dayInfo.date}
                                className="relative"
                                onMouseEnter={() => setHoveredDay(dayInfo.date)}
                                onMouseLeave={() => setHoveredDay(null)}
                            >
                                {/* Day Cell */}
                                {hasEntries ? (
                                    <Link
                                        to={username ? `/users/${username}/diary?date=${dayInfo.date}` : `/diary?date=${dayInfo.date}`}
                                        onClick={() => onDayClick?.(dayInfo.date, entries)}
                                        className={`group relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-lg border transition-all ${todayClass} ${hasEntries
                                                ? "border-amber-400/20 bg-amber-400/10 hover:border-amber-400/40 hover:bg-amber-400/20"
                                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                                            }`}
                                    >
                                        {/* Film Poster Preview (shown on hover) */}
                                        {hasEntries && entries[0].filmPoster && (
                                            <div
                                                className={`absolute inset-0 transition-opacity duration-200 ${isHovered ? "opacity-30" : "opacity-0"
                                                    }`}
                                            >
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w185${entries[0].filmPoster}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        )}

                                        {/* Day Number */}
                                        <span
                                            className={`relative z-10 text-sm font-medium ${hasEntries ? "text-amber-300" : "text-white/50"
                                                }`}
                                        >
                                            {dayInfo.day}
                                        </span>

                                        {/* Entry Count */}
                                        {entries.length > 0 && (
                                            <span className="relative z-10 text-[10px] text-amber-400/80">
                                                {entries.length} {entries.length === 1 ? "film" : "films"}
                                            </span>
                                        )}

                                        {/* Mood Indicator */}
                                        {entries.length > 0 && entries[0].mood && (
                                            <div className="absolute bottom-1 right-1 z-10">
                                                <MoodBadge mood={entries[0].mood} showLabel={false} size="sm" />
                                            </div>
                                        )}
                                    </Link>
                                ) : (
                                    <div
                                        className={`flex aspect-square flex-col items-center justify-center rounded-lg border border-white/5 bg-white/[0.01] ${todayClass}`}
                                    >
                                        <span className="text-sm text-white/30">{dayInfo.day}</span>
                                    </div>
                                )}

                                {/* Hover Popup */}
                                {isHovered && hasEntries && (
                                    <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-white/10 bg-slate-900 p-3 shadow-xl">
                                        <p className="mb-2 text-xs font-medium text-white/50">
                                            {new Date(dayInfo.date).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                        <div className="space-y-2">
                                            {entries.slice(0, 3).map((entry) => (
                                                <Link
                                                    key={entry.id}
                                                    to={`/diary/${entry.id}`}
                                                    className="group flex items-center gap-2 rounded-lg bg-white/5 p-2 transition hover:bg-white/10"
                                                >
                                                    {/* Mini Poster */}
                                                    <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-white/10">
                                                        {entry.filmPoster ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w92${entry.filmPoster}`}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center">
                                                                <Film className="h-3 w-3 text-white/30" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-xs font-medium text-white group-hover:text-amber-300">
                                                            {entry.filmTitle}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            {entry.rating && (
                                                                <span className="text-[10px] text-amber-400">
                                                                    ★ {entry.rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                            {entry.mood && (
                                                                <MoodBadge mood={entry.mood} showLabel={false} size="sm" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}

                                            {entries.length > 3 && (
                                                <p className="text-center text-[10px] text-white/40">
                                                    +{entries.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded border border-amber-400/20 bg-amber-400/10" />
                    <span className="text-white/50">Has entries</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded ring-2 ring-amber-400 ring-offset-1 ring-offset-black" />
                    <span className="text-white/50">Today</span>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mini Calendar (for sidebars)
// ─────────────────────────────────────────────────────────────────────────────

type MiniCalendarProps = {
    data: CalendarData
    year: number
    month: number
    onMonthChange: (year: number, month: number) => void
}

export function MiniCalendar({ data, year, month, onMonthChange }: MiniCalendarProps) {
    const calendarDays = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate()
        const firstDayOfWeek = new Date(year, month - 1, 1).getDay()
        const days: Array<{ date: string; day: number } | null> = []

        for (let i = 0; i < firstDayOfWeek; i++) {
            days.push(null)
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            days.push({ date, day })
        }

        return days
    }, [year, month])

    return (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
                <button
                    onClick={() => onMonthChange(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1)}
                    className="p-1 text-white/50 hover:text-white"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-medium text-white/70">
                    {MONTHS[month - 1].slice(0, 3)} {year}
                </span>
                <button
                    onClick={() => onMonthChange(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1)}
                    className="p-1 text-white/50 hover:text-white"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="p-1 text-center text-[8px] text-white/30">
                        {d}
                    </div>
                ))}
                {calendarDays.map((dayInfo, idx) =>
                    !dayInfo ? (
                        <div key={`empty-${idx}`} className="p-1" />
                    ) : (
                        <div
                            key={dayInfo.date}
                            className={`flex h-6 w-6 items-center justify-center rounded text-[10px] ${(data[dayInfo.date]?.length ?? 0) > 0
                                    ? "bg-amber-400/20 font-medium text-amber-300"
                                    : "text-white/40"
                                }`}
                        >
                            {dayInfo.day}
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
