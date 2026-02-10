import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../../services/notificationApi"
import { acceptContributorInvitation } from "../../services/listApi"

type NotificationsBellProps = {
  compact?: boolean
}

const POLL_INTERVAL_MS = 45000

function getInitials(name?: string | null, username?: string | null) {
  const source = (name || username || "U").trim()
  if (!source) return "U"
  const parts = source.split(" ").filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function formatTimeAgo(value: string) {
  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return ""

  const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  if (diffSeconds < 60) return "just now"

  const minutes = Math.floor(diffSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(months / 12)
  return `${years}y ago`
}

export default function NotificationsBell({ compact = false }: NotificationsBellProps) {
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [markAllBusy, setMarkAllBusy] = useState(false)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount()
      setUnreadCount(count)
    } catch {
      // Ignore polling failures silently.
    }
  }

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const payload = await getNotifications(1, 12, false)
      setItems(payload.notifications ?? [])
      setUnreadCount(Number(payload.unreadCount ?? 0))
    } catch (err: any) {
      setError(err?.message ?? "Failed to load notifications.")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    void refreshUnreadCount()
    const interval = setInterval(() => {
      void refreshUnreadCount()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!open) return
    void loadNotifications()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const markItemReadLocally = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id && !item.isRead
          ? {
              ...item,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : item
      )
    )
  }

  const handleOpenToggle = () => {
    setOpen((prev) => !prev)
  }

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      markItemReadLocally(item.id)
      setUnreadCount((prev) => Math.max(0, prev - 1))
      try {
        await markNotificationAsRead(item.id)
      } catch {
        // Ignore transient failure; next refresh will re-sync.
      }
    }

    if (item.href) {
      setOpen(false)
      navigate(item.href)
    }
  }

  const handleMarkAllRead = async () => {
    if (markAllBusy || unreadCount <= 0) return
    setMarkAllBusy(true)
    setError(null)

    const previous = items
    setItems((prev) =>
      prev.map((item) =>
        item.isRead
          ? item
          : {
              ...item,
              isRead: true,
              readAt: new Date().toISOString(),
            }
      )
    )
    setUnreadCount(0)

    try {
      await markAllNotificationsAsRead()
    } catch (err: any) {
      setItems(previous)
      setUnreadCount(previous.filter((item) => !item.isRead).length)
      setError(err?.message ?? "Failed to mark all notifications as read.")
    } finally {
      setMarkAllBusy(false)
    }
  }

  const handleAcceptInvite = async (item: NotificationItem, event: ReactMouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (actionBusyId || item.action?.type !== "accept_invite") return

    setActionBusyId(item.id)
    setError(null)
    try {
      await acceptContributorInvitation(item.action.contributorId)
      if (!item.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      markItemReadLocally(item.id)
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                action: null,
              }
            : entry
        )
      )
      await markNotificationAsRead(item.id)
    } catch (err: any) {
      setError(err?.message ?? "Failed to accept invitation.")
    } finally {
      setActionBusyId(null)
    }
  }

  const buttonClass = compact
    ? "relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"
    : "relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleOpenToggle}
        className={buttonClass}
        aria-label="Notifications"
      >
        <Bell className={`h-4 w-4 ${unreadCount > 0 ? "text-amber-300" : "text-slate-300"}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full border border-amber-300/40 bg-amber-400/95 px-1.5 text-center text-[10px] font-semibold leading-5 text-black">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-full mt-3 w-[min(24rem,calc(100vw-1.5rem))] origin-top-right rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        <div className="mb-2 flex items-center justify-between border-b border-white/5 px-3 pb-2">
          <div>
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-amber-400/60">
              Notifications
            </p>
            <p className="mt-0.5 text-xs text-white/45">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllBusy || unreadCount <= 0}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              markAllBusy || unreadCount <= 0
                ? "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200 hover:border-amber-400/60 hover:bg-amber-400/20"
            }`}
          >
            {markAllBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
            Mark all
          </button>
        </div>

        <div className="max-h-[26rem] overflow-y-auto pr-1">
          {loading && (
            <div className="space-y-2 px-2 py-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="mx-2 my-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-white/45">
              No notifications yet.
            </div>
          )}

          {!loading &&
            items.map((item) => {
              const isUnread = !item.isRead
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    void handleItemClick(item)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      void handleItemClick(item)
                    }
                  }}
                  className={`group mb-1.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    isUnread
                      ? "border-amber-400/25 bg-amber-400/[0.07] hover:border-amber-300/40"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                  } ${item.href ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-start gap-3">
                    {item.actor?.avatarUrl ? (
                      <img
                        src={item.actor.avatarUrl}
                        alt={item.actor.name ?? item.actor.username ?? "User avatar"}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/70">
                        {getInitials(item.actor?.name, item.actor?.username)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        {isUnread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-300" />}
                      </div>
                      {item.body && (
                        <p className="mt-0.5 truncate text-xs text-white/55">{item.body}</p>
                      )}
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-white/40">{formatTimeAgo(item.createdAt)}</p>
                        {item.action?.type === "accept_invite" && (
                          <button
                            type="button"
                            onClick={(event) => {
                              void handleAcceptInvite(item, event)
                            }}
                            disabled={actionBusyId === item.id}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                              actionBusyId === item.id
                                ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                                : "border-emerald-400/35 bg-emerald-400/12 text-emerald-200 hover:border-emerald-400/60 hover:bg-emerald-400/20"
                            }`}
                          >
                            {actionBusyId === item.id ? "Accepting..." : "Accept"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
