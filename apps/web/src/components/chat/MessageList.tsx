import { useEffect, useMemo, useRef, useState } from "react"
import { useChatStore } from "@/stores/chatStore"
import MessageCard from "./MessageCard"
import api from "@/services/api"
import { useAuthStore } from "@/stores/authStore"

export default function MessageList() {
  const messages = useChatStore((state) => state.messages)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [userMap, setUserMap] = useState<Record<string, { name: string; avatarUrl?: string | null; username?: string | null }>>({})
  const currentUser = useAuthStore((state) => state.user)
  const currentUserId = currentUser?.id ?? null

  const orderedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messages]
  )

  const userIds = useMemo(
    () => Array.from(new Set(orderedMessages.map((message) => message.user_id))),
    [orderedMessages]
  )

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [orderedMessages.length])

  useEffect(() => {
    if (!currentUserId || !currentUser) return
    setUserMap((prev) => ({
      ...prev,
      [currentUserId]: {
        name: currentUser.name ?? currentUser.username ?? currentUser.email ?? "You",
        avatarUrl: currentUser.avatarUrl ?? null,
        username: currentUser.username ?? null,
      },
    }))
  }, [currentUserId, currentUser?.name, currentUser?.username, currentUser?.email, currentUser?.avatarUrl])

  useEffect(() => {
    let active = true
    const fetchUsers = async () => {
      if (userIds.length === 0) return
      const missing = userIds.filter((id) => !userMap[id])
      if (missing.length === 0) return
      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            const res = await api.get(`/users/id/${id}`)
            return res.data
          })
        )
        if (!active) return
        setUserMap((prev) => {
          const next = { ...prev }
          results.forEach((user) => {
            next[user.id] = {
              name: user.name ?? user.username ?? user.email ?? `User ${user.id.substring(0, 8)}`,
              avatarUrl: user.avatarUrl ?? null,
              username: user.username ?? null,
            }
          })
          return next
        })
      } catch {
        // ignore lookup errors
      }
    }
    fetchUsers()
    return () => {
      active = false
    }
  }, [userIds.join("|")])

  if (orderedMessages.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="mb-2 text-lg">No messages yet</p>
          <p className="text-sm">Be the first to start the discussion!</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-2 pt-4">
      <div className="space-y-4">
        {orderedMessages.map((message) => (
          <MessageCard
            key={message.id}
            message={message}
            displayName={userMap[message.user_id]?.name}
            avatarUrl={userMap[message.user_id]?.avatarUrl}
            isOwn={currentUserId === message.user_id}
            userMap={userMap}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  )
}
