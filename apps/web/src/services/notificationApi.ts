import api from "./api"

export type NotificationType =
  | "FOLLOWED_YOU"
  | "REVIEW_LIKED"
  | "REVIEW_COMMENTED"
  | "LIST_LIKED"
  | "LIST_SAVED"
  | "LIST_INVITE"
  | "LIST_INVITE_ACCEPTED"
  | "LIST_COLLABORATOR_REMOVED"

export type NotificationAction =
  | {
      type: "accept_invite"
      contributorId: string
    }
  | null

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  href?: string | null
  createdAt: string
  readAt?: string | null
  isRead: boolean
  actor?: {
    id: string
    username?: string | null
    name?: string | null
    avatarUrl?: string | null
  } | null
  list?: {
    id: string
    slug: string
    title: string
  } | null
  review?: {
    id: string
    filmId: number
    film?: {
      id: number
      title: string
      posterPath?: string | null
    } | null
  } | null
  metadata?: Record<string, unknown>
  action?: NotificationAction
}

export type NotificationListResponse = {
  page: number
  pageSize: number
  total: number
  unreadCount: number
  notifications: NotificationItem[]
}

export async function getNotifications(page = 1, pageSize = 12, unreadOnly = false) {
  const response = await api.get<NotificationListResponse>("/notifications", {
    params: { page, pageSize, unreadOnly },
  })
  return response.data
}

export async function getUnreadNotificationCount() {
  const response = await api.get<{ unreadCount: number }>("/notifications/unread-count")
  return Number(response.data?.unreadCount ?? 0)
}

export async function markNotificationAsRead(notificationId: string) {
  const response = await api.post<{ success: boolean }>(`/notifications/${notificationId}/read`)
  return response.data
}

export async function markAllNotificationsAsRead() {
  const response = await api.post<{ success: boolean; updated: number }>("/notifications/read-all")
  return response.data
}

export async function clearAllNotifications() {
  const response = await api.post<{ success: boolean; deleted: number }>("/notifications/clear-all")
  return response.data
}
