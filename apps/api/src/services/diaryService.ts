import { Prisma, PrismaClient } from "@prisma/client"
import { cacheFilm } from "./filmService"
import { getFilmDetails as tmdbGetFilmDetails } from "./tmdbService"

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CreateDiaryEntryInput = {
    userId: string
    filmId: number
    watchedDate?: string | Date
    mood?: string | null
    rating?: number | null
    location?: string | null
    venue?: string | null
    format?: string | null
    vibes?: string[]
    companions?: string[]
    notes?: string | null
    isPrivate?: boolean
    linkToReview?: boolean
}

export type UpdateDiaryEntryInput = {
    watchedDate?: string | Date
    mood?: string | null
    rating?: number | null
    location?: string | null
    venue?: string | null
    format?: string | null
    vibes?: string[]
    companions?: string[]
    notes?: string | null
    isPrivate?: boolean
    linkToReview?: boolean
}

export type DiaryListOptions = {
    page?: number
    pageSize?: number
    sortBy?: "newest" | "oldest"
    location?: string
    format?: string
    year?: number
    month?: number
}

export type CalendarOptions = {
    year: number
    month?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function ensureFilmCached(filmId: number) {
    const existingFilm = await prisma.film.findUnique({ where: { id: filmId } })
    if (!existingFilm) {
        const details = await tmdbGetFilmDetails(filmId)
        await cacheFilm(details)
    }
}

async function createActivity({
    type,
    userId,
    filmId,
    metadata,
}: {
    type: string
    userId: string
    filmId?: number
    metadata?: Record<string, unknown>
}) {
    return prisma.activity.create({
        data: {
            type,
            userId,
            filmId,
            metadata: metadata as Prisma.InputJsonValue | undefined,
        },
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function createEntry(data: CreateDiaryEntryInput) {
    await ensureFilmCached(data.filmId)

    const entry = await prisma.diaryEntry.create({
        data: {
            userId: data.userId,
            filmId: data.filmId,
            watchedDate: data.watchedDate ? new Date(data.watchedDate) : new Date(),
            mood: data.mood ?? null,
            rating: data.rating ?? null,
            location: data.location ?? null,
            venue: data.venue ?? null,
            format: data.format ?? null,
            vibes: data.vibes ?? [],
            companions: data.companions ?? [],
            notes: data.notes ?? null,
            isPrivate: data.isPrivate ?? false,
            linkToReview: data.linkToReview ?? false,
        },
        include: { film: true },
    })

    await createActivity({
        type: "diary_entry_created",
        userId: data.userId,
        filmId: data.filmId,
        metadata: { diaryEntryId: entry.id, mood: entry.mood },
    })

    return entry
}

export async function updateEntry(
    id: string,
    userId: string,
    data: UpdateDiaryEntryInput
) {
    const existing = await prisma.diaryEntry.findUnique({ where: { id } })
    if (!existing) {
        throw new Error("Diary entry not found")
    }
    if (existing.userId !== userId) {
        throw new Error("Not authorized to update this diary entry")
    }

    const updated = await prisma.diaryEntry.update({
        where: { id },
        data: {
            watchedDate:
                data.watchedDate !== undefined
                    ? new Date(data.watchedDate)
                    : existing.watchedDate,
            mood: data.mood !== undefined ? data.mood : existing.mood,
            rating: data.rating !== undefined ? data.rating : existing.rating,
            location: data.location !== undefined ? data.location : existing.location,
            venue: data.venue !== undefined ? data.venue : existing.venue,
            format: data.format !== undefined ? data.format : existing.format,
            vibes: data.vibes !== undefined ? data.vibes : existing.vibes,
            companions:
                data.companions !== undefined ? data.companions : existing.companions,
            notes: data.notes !== undefined ? data.notes : existing.notes,
            isPrivate:
                data.isPrivate !== undefined ? data.isPrivate : existing.isPrivate,
            linkToReview:
                data.linkToReview !== undefined ? data.linkToReview : existing.linkToReview,
        },
        include: { film: true },
    })

    await createActivity({
        type: "diary_entry_updated",
        userId,
        filmId: updated.filmId,
        metadata: { diaryEntryId: updated.id },
    })

    return updated
}

export async function deleteEntry(id: string, userId: string) {
    const existing = await prisma.diaryEntry.findUnique({ where: { id } })
    if (!existing) {
        throw new Error("Diary entry not found")
    }
    if (existing.userId !== userId) {
        throw new Error("Not authorized to delete this diary entry")
    }

    await prisma.diaryEntry.delete({ where: { id } })

    await createActivity({
        type: "diary_entry_deleted",
        userId,
        filmId: existing.filmId,
    })

    return { success: true }
}

export async function getEntry(id: string, requesterId?: string) {
    const entry = await prisma.diaryEntry.findUnique({
        where: { id },
        include: {
            film: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    username: true,
                    avatarUrl: true,
                },
            },
        },
    })

    if (!entry) {
        throw new Error("Diary entry not found")
    }

    // Check privacy - only owner can see private entries
    if (entry.isPrivate && entry.userId !== requesterId) {
        throw new Error("This diary entry is private")
    }

    let reviewId: string | null = null
    if (entry.linkToReview) {
        const review = await prisma.review.findUnique({
            where: {
                userId_filmId: {
                    userId: entry.userId,
                    filmId: entry.filmId,
                },
            },
            select: { id: true },
        })
        reviewId = review?.id ?? null
    }

    return {
        ...entry,
        reviewId,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Operations
// ─────────────────────────────────────────────────────────────────────────────

export async function getUserDiary(
    userId: string,
    requesterId: string | undefined,
    options: DiaryListOptions = {}
) {
    const page = Math.max(1, options.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20))
    const sortBy = options.sortBy ?? "newest"

    // Build where clause
    const where: any = { userId }

    // Only show public entries if not the owner
    if (requesterId !== userId) {
        where.isPrivate = false
    }

    // Filter by mood
    if (options.location) {
        where.location = options.location
    }

    // Filter by format
    if (options.format) {
        where.format = options.format
    }

    // Filter by year
    if (options.year) {
        const startDate = new Date(options.year, options.month ? options.month - 1 : 0, 1)
        const endDate = options.month
            ? new Date(options.year, options.month, 0, 23, 59, 59, 999)
            : new Date(options.year, 11, 31, 23, 59, 59, 999)

        where.watchedDate = {
            gte: startDate,
            lte: endDate,
        }
    }

    const [total, entries] = await Promise.all([
        prisma.diaryEntry.count({ where }),
        prisma.diaryEntry.findMany({
            where,
            orderBy:
                sortBy === "newest"
                    ? [{ createdAt: "desc" }, { watchedDate: "desc" }]
                    : [{ watchedDate: "asc" }, { createdAt: "asc" }],
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                film: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        }),
    ])

    const filmIdsNeedingReview = entries
        .filter((entry) => entry.linkToReview)
        .map((entry) => entry.filmId)

    const reviewMap = new Map<number, string>()
    if (filmIdsNeedingReview.length > 0) {
        const reviews = await prisma.review.findMany({
            where: {
                userId,
                filmId: { in: filmIdsNeedingReview },
            },
            select: {
                id: true,
                filmId: true,
            },
        })
        for (const review of reviews) {
            reviewMap.set(review.filmId, review.id)
        }
    }

    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        sortBy,
        results: entries.map((entry) => ({
            ...entry,
            reviewId: entry.linkToReview ? reviewMap.get(entry.filmId) ?? null : null,
        })),
    }
}

export async function getDiaryCalendar(
    userId: string,
    requesterId: string | undefined,
    options: CalendarOptions
) {
    const { year, month } = options

    const startDate = new Date(year, month ? month - 1 : 0, 1)
    const endDate = month
        ? new Date(year, month, 0, 23, 59, 59, 999)
        : new Date(year, 11, 31, 23, 59, 59, 999)

    const where: any = {
        userId,
        watchedDate: {
            gte: startDate,
            lte: endDate,
        },
    }

    // Only show public entries if not the owner
    if (requesterId !== userId) {
        where.isPrivate = false
    }

    const entries = await prisma.diaryEntry.findMany({
        where,
        orderBy: { watchedDate: "asc" },
        include: {
            film: {
                select: {
                    id: true,
                    title: true,
                    posterPath: true,
                },
            },
        },
    })

    // Group entries by date
    const calendar: Record<
        string,
        Array<{
            id: string
            filmId: number
            filmTitle: string
            filmPoster: string | null
            mood: string | null
            rating: number | null
        }>
    > = {}

    for (const entry of entries) {
        const dateKey = entry.watchedDate.toISOString().split("T")[0]
        if (!calendar[dateKey]) {
            calendar[dateKey] = []
        }
        calendar[dateKey].push({
            id: entry.id,
            filmId: entry.filmId,
            filmTitle: entry.film.title,
            filmPoster: entry.film.posterPath,
            mood: entry.mood,
            rating: entry.rating,
        })
    }

    return {
        year,
        month: month ?? null,
        totalEntries: entries.length,
        calendar,
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats & Insights
// ─────────────────────────────────────────────────────────────────────────────

export async function getDiaryStats(userId: string) {
    const entries = await prisma.diaryEntry.findMany({
        where: { userId },
        select: {
            mood: true,
            format: true,
            location: true,
            vibes: true,
            rating: true,
            watchedDate: true,
        },
    })

    // Mood distribution
    const moodCounts: Record<string, number> = {}
    for (const entry of entries) {
        if (entry.mood) {
            moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
        }
    }

    // Format distribution
    const formatCounts: Record<string, number> = {}
    for (const entry of entries) {
        if (entry.format) {
            formatCounts[entry.format] = (formatCounts[entry.format] || 0) + 1
        }
    }

    // Location distribution
    const locationCounts: Record<string, number> = {}
    for (const entry of entries) {
        if (entry.location) {
            locationCounts[entry.location] = (locationCounts[entry.location] || 0) + 1
        }
    }

    // Average rating
    const ratings = entries.filter((e) => e.rating !== null).map((e) => e.rating!)
    const averageRating =
        ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
            : null

    return {
        totalEntries: entries.length,
        moodDistribution: moodCounts,
        formatDistribution: formatCounts,
        locationDistribution: locationCounts,
        averageRating,
    }
}
