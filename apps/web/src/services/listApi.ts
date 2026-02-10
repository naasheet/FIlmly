import api from "./api"
import type { List, ListFilm } from "../stores/listStore"

export type UserSearchResult = {
  id: string
  username?: string | null
  name?: string | null
  avatarUrl?: string | null
}

export type CreateListInput = {
  title: string
  description?: string | null
  listType?: "PERSONAL" | "COLLABORATIVE" | "TEMPLATE"
  privacy?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  isRanked?: boolean
  tags?: string[]
}

export type UpdateListInput = {
  title?: string
  description?: string | null
  listType?: "PERSONAL" | "COLLABORATIVE" | "TEMPLATE"
  privacy?: "PUBLIC" | "UNLISTED" | "PRIVATE"
  isRanked?: boolean
  tags?: string[]
  coverImagePath?: string | null
  pinned?: boolean
}

export type ReorderItem = {
  filmId: number
  rank: number
}

export type ListSearchParams = {
  q?: string
  privacy?: Array<"PUBLIC" | "UNLISTED" | "PRIVATE"> | string
  listType?: Array<"PERSONAL" | "COLLABORATIVE" | "TEMPLATE"> | string
  rankedOnly?: boolean
  category?: string
  tags?: string[] | string
  filmCountRange?: string
  filmId?: string
  page?: number
  pageSize?: number
  sortBy?: "trending" | "most_liked" | "newest" | "recently_updated" | "most_films" | "az"
}

export async function createList(data: CreateListInput) {
  const response = await api.post<List>("/lists", data)
  return response.data
}

export async function getList(identifier: string) {
  const response = await api.get<List>(`/lists/${identifier}`)
  return response.data
}

export async function getListFull(listId: string, page = 1, pageSize = 24) {
  const response = await api.get<List & { stats?: any; comments?: any[]; totalFilms?: number; page?: number; pageSize?: number }>(
    `/lists/${listId}/full`,
    { params: { page, pageSize } }
  )
  return response.data
}

export async function getListFilms(listId: string, page = 1, pageSize = 24) {
  const response = await api.get<{
    films: ListFilm[]
    page: number
    pageSize: number
    total: number
    isRanked: boolean
  }>(`/lists/${listId}/films`, {
    params: { page, pageSize },
  })
  return response.data
}

export async function updateList(listId: string, data: UpdateListInput) {
  const response = await api.put<List>(`/lists/${listId}`, data)
  return response.data
}

export async function deleteList(listId: string) {
  const response = await api.delete<void>(`/lists/${listId}`)
  return response.data
}

export async function addFilmToList(listId: string, filmId: number, rank?: number, notes?: string) {
  const response = await api.post<ListFilm>(`/lists/${listId}/films`, {
    filmId,
    rank,
    notes,
  })
  return response.data
}

export async function bulkAddFilmToLists(filmId: number, listIds: string[]) {
  const response = await api.post<{
    added: string[]
    skipped: string[]
    unauthorized: string[]
  }>(`/lists/bulk-add`, { filmId, listIds })
  return response.data
}

export async function uploadListCover(listId: string, file: File) {
  const formData = new FormData()
  formData.append("cover", file)
  const response = await api.post<{ coverImagePath: string }>(`/lists/${listId}/cover`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

export async function removeFilmFromList(listId: string, filmId: number) {
  const response = await api.delete<void>(`/lists/${listId}/films/${filmId}`)
  return response.data
}

export async function reorderFilms(listId: string, items: ReorderItem[]) {
  const response = await api.put<{ success: boolean }>(`/lists/${listId}/films/reorder`, {
    items,
  })
  return response.data
}

export async function likeList(listId: string) {
  const response = await api.post<{ likeCount: number }>(`/lists/${listId}/like`)
  return response.data
}

export async function unlikeList(listId: string) {
  const response = await api.delete<{ likeCount: number }>(`/lists/${listId}/like`)
  return response.data
}

export async function saveList(listId: string) {
  const response = await api.post<{ saved: boolean }>(`/lists/${listId}/save`)
  return response.data
}

export async function unsaveList(listId: string) {
  const response = await api.delete<{ saved: boolean }>(`/lists/${listId}/save`)
  return response.data
}

export async function getMyLists() {
  const response = await api.get<{
    created: List[]
    collaborating: List[]
    liked: List[]
    saved: List[]
  }>("/users/me/lists")
  return response.data
}

export async function searchLists(params?: ListSearchParams) {
  const nextParams = { ...params }
  if (Array.isArray(nextParams.privacy)) {
    nextParams.privacy = nextParams.privacy.join(",")
  }
  if (Array.isArray(nextParams.listType)) {
    nextParams.listType = nextParams.listType.join(",")
  }
  if (Array.isArray(nextParams.tags)) {
    nextParams.tags = nextParams.tags.join(",")
  }
  const response = await api.get<List[]>("/lists", { params: nextParams })
  return response.data
}

export async function fetchPopularTags() {
  const response = await api.get<{ tags: string[] }>("/lists/popular-tags")
  return response.data?.tags ?? []
}

export async function getUsersWhoLiked(listId: string, page = 1, pageSize = 20) {
  const response = await api.get<{ users: Array<{ id: string; username: string; name?: string | null; avatarUrl?: string | null }> }>(
    `/lists/${listId}/likes`,
    { params: { page, pageSize } }
  )
  return response.data
}

export async function getListActivities(listId: string, page = 1, pageSize = 10) {
  const response = await api.get<{ activities: any[] }>(`/lists/${listId}/activity`, {
    params: { page, pageSize },
  })
  return response.data
}

export async function searchUsers(query: string) {
  const response = await api.get<{ results: UserSearchResult[] }>("/users/search", {
    params: { query },
  })
  return response.data.results ?? []
}

export async function inviteContributor(
  listId: string,
  userId: string
) {
  const response = await api.post(`/lists/${listId}/contributors/invite`, {
    userId,
    role: "EDITOR",
  })
  return response.data
}

export async function removeContributor(listId: string, contributorId: string) {
  const response = await api.delete(`/lists/${listId}/contributors/${contributorId}`)
  return response.data
}

export async function acceptContributorInvitation(contributorId: string) {
  const response = await api.post(`/lists/contributors/${contributorId}/accept`)
  return response.data
}
