import api from "./api"
import type { DiaryEntryData } from "../components/diary/DiaryEntry"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CreateDiaryEntryInput = {
    filmId: number
    watchedDate?: string
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
}

export type UpdateDiaryEntryInput = Omit<CreateDiaryEntryInput, "filmId">

export type DiaryListParams = {
    page?: number
    pageSize?: number
    sortBy?: "newest" | "oldest"
    location?: string
    format?: string
    year?: number
    month?: number
}

export type DiaryListResponse = {
    page: number
    pageSize: number
    total: number
    totalPages: number
    sortBy: string
    results: DiaryEntryData[]
}

export type DiaryCalendarResponse = {
    year: number
    month: number | null
    totalEntries: number
    calendar: Record<
        string,
        Array<{
            id: string
            filmId: number
            filmTitle: string
            filmPoster: string | null
            mood: string | null
        }>
    >
}

export type DiaryStatsResponse = {
    totalEntries: number
    moodDistribution: Record<string, number>
    formatDistribution: Record<string, number>
    locationDistribution: Record<string, number>
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function createDiaryEntry(data: CreateDiaryEntryInput) {
    const response = await api.post<DiaryEntryData>("/diary", data)
    return response.data
}

export async function getDiaryEntry(id: string) {
    const response = await api.get<DiaryEntryData>(`/diary/${id}`)
    return response.data
}

export async function updateDiaryEntry(id: string, data: UpdateDiaryEntryInput) {
    const response = await api.patch<DiaryEntryData>(`/diary/${id}`, data)
    return response.data
}

export async function deleteDiaryEntry(id: string) {
    const response = await api.delete<{ success: boolean }>(`/diary/${id}`)
    return response.data
}

export async function getUserDiary(username: string, params?: DiaryListParams) {
    const response = await api.get<DiaryListResponse>(`/users/${username}/diary`, {
        params,
    })
    return response.data
}

export async function getUserDiaryCalendar(
    username: string,
    year: number,
    month?: number
) {
    const response = await api.get<DiaryCalendarResponse>(
        `/users/${username}/diary/calendar`,
        { params: { year, month } }
    )
    return response.data
}

export async function getUserDiaryStats(username: string) {
    const response = await api.get<DiaryStatsResponse>(
        `/users/${username}/diary/stats`
    )
    return response.data
}
