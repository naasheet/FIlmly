import { create } from "zustand"

export type ListUser = {
  id: string
  username?: string | null
  name?: string | null
  avatarUrl?: string | null
}

export type ListFilm = {
  id: string
  listId: string
  filmId: number
  rank?: number | null
  notes?: string | null
  addedBy: string
  addedAt: string
  film?: {
    id: number
    title: string
    posterPath?: string | null
    releaseDate?: string | null
    runtime?: number | null
    genres?: string[]
    director?: string | null
    cast?: string[]
    tmdbRating?: number | null
  }
  user?: ListUser
}

export type ListContributor = {
  id: string
  listId: string
  userId: string
  role: "OWNER" | "EDITOR"
  status?: "PENDING" | "ACCEPTED" | "DECLINED"
  invitedBy?: string | null
  addedAt: string
  user?: ListUser
}

export type ListActivity = {
  id: string
  listId: string
  userId: string
  activityType:
    | "LIST_CREATED"
    | "FILM_ADDED"
    | "FILM_REMOVED"
    | "FILM_REORDERED"
    | "TITLE_UPDATED"
    | "DESCRIPTION_UPDATED"
    | "CONTRIBUTOR_ADDED"
    | "CONTRIBUTOR_REMOVED"
    | "LIST_PUBLISHED"
  filmId?: number | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  user?: ListUser
}

export type List = {
  id: string
  slug: string
  title: string
  description?: string | null
  listType: "PERSONAL" | "COLLABORATIVE" | "TEMPLATE"
  privacy: "PUBLIC" | "UNLISTED" | "PRIVATE"
  isRanked: boolean
  userId: string
  filmCount: number
  likeCount: number
  commentCount: number
  viewCount: number
  followerCount: number
  collaboratorCount: number
  itemCount: number
  shareCount: number
  pinned: boolean
  coverImagePath?: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  lastActivityAt?: string | null
  user?: ListUser
  films?: ListFilm[]
  contributors?: ListContributor[]
  activities?: ListActivity[]
  isLiked?: boolean
  isSaved?: boolean
  canEdit?: boolean
  isOwner?: boolean
}

type ListState = {
  currentList: List | null
  myLists: List[]
  isLoading: boolean
  error: string | null
  setCurrentList: (list: List | null) => void
  addToMyLists: (list: List) => void
  removeFromMyLists: (listId: string) => void
  updateList: (listId: string, updates: Partial<List>) => void
  clearList: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useListStore = create<ListState>((set) => ({
  currentList: null,
  myLists: [],
  isLoading: false,
  error: null,
  setCurrentList: (list) => set({ currentList: list }),
  addToMyLists: (list) =>
    set((state) => ({
      myLists: state.myLists.some((item) => item.id === list.id)
        ? state.myLists
        : [list, ...state.myLists],
    })),
  removeFromMyLists: (listId) =>
    set((state) => ({
      myLists: state.myLists.filter((list) => list.id !== listId),
    })),
  updateList: (listId, updates) =>
    set((state) => ({
      currentList:
        state.currentList && state.currentList.id === listId
          ? { ...state.currentList, ...updates }
          : state.currentList,
      myLists: state.myLists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      ),
    })),
  clearList: () => set({ currentList: null, error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}))
