import { useEffect, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { supabase, isUserBanned } from "@/lib/supabase"
import { useChatStore } from "@/stores/chatStore"
import { useAuthStore } from "@/stores/authStore"
import MessageList from "./MessageList"
import MessageInput from "./MessageInput"

interface ChatContainerProps {
  filmId: number
}

export default function ChatContainer({ filmId }: ChatContainerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBanned, setIsBanned] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const presenceIntervalRef = useRef<number | null>(null)

  const {
    setFilmId,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setConnected,
    clearChat,
    addReaction,
    removeReaction,
    setChannel: setStoreChannel,
    setOnlineUsers,
  } = useChatStore()
  const appUser = useAuthStore((state) => state.user)

  useEffect(() => {
    initChat()
    return () => cleanup()
  }, [filmId, appUser?.id])

  const initChat = async () => {
    try {
      setFilmId(filmId)

      // Check authentication (Filmly login)
      if (!appUser) {
        setError("Please log in to chat")
        setLoading(false)
        return
      }

      // Check if banned
      const banned = await isUserBanned(appUser.id, filmId)
      if (banned) {
        setIsBanned(true)
        setError("You are banned from this discussion")
        setLoading(false)
        return
      }

      // Load initial messages from database
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("film_id", filmId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(50)

      if (messagesError) throw messagesError
      setMessages(messages || [])

      // Create broadcast channel (FREE!)
      const chatChannel = supabase.channel(`film:${filmId}`, {
        config: {
          broadcast: { self: true },
        },
      })

      // Listen for new messages
      chatChannel.on("broadcast", { event: "new_message" }, (payload) => {
        addMessage(payload.payload)
      })

      // Listen for message updates (edits)
      chatChannel.on("broadcast", { event: "update_message" }, (payload) => {
        updateMessage(payload.payload.id, payload.payload.updates)
      })

      // Listen for message deletions
      chatChannel.on("broadcast", { event: "delete_message" }, (payload) => {
        removeMessage(payload.payload.id)
      })

      // Listen for reactions
      chatChannel.on("broadcast", { event: "add_reaction" }, (payload) => {
        addReaction(payload.payload.messageId, payload.payload.emoji, payload.payload.userId)
      })

      chatChannel.on("broadcast", { event: "remove_reaction" }, (payload) => {
        removeReaction(payload.payload.messageId, payload.payload.emoji, payload.payload.userId)
      })

      // Listen for typing indicators
      chatChannel.on("broadcast", { event: "typing" }, () => {
        // Handle typing indicator (we'll implement later)
      })

      // Subscribe to channel
      chatChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true)
          setLoading(false)

          // Update presence
          await updatePresence(appUser.id, filmId)
          await fetchOnlineUsers(filmId)
        }
      })

      setChannel(chatChannel)
      setStoreChannel(chatChannel)

      // Heartbeat to keep presence updated
      if (presenceIntervalRef.current) {
        window.clearInterval(presenceIntervalRef.current)
      }
      presenceIntervalRef.current = window.setInterval(async () => {
        if (appUser) {
          await updatePresence(appUser.id, filmId)
          await fetchOnlineUsers(filmId)
        }
      }, 30000)
    } catch (err) {
      console.error("Chat init error:", err)
      setError("Failed to connect to chat")
      setLoading(false)
    }
  }

  const updatePresence = async (userId: string, filmId: number) => {
    await supabase.rpc("update_presence", {
      p_user_id: userId,
      p_film_id: filmId,
    })
  }

  const fetchOnlineUsers = async (filmId: number) => {
    const since = new Date(Date.now() - 120_000).toISOString()
    const { data, error } = await supabase
      .from("online_presence")
      .select("user_id, film_id, last_seen")
      .eq("film_id", filmId)
      .gte("last_seen", since)
    if (error) return
    setOnlineUsers(data ?? [])
  }

  const cleanup = () => {
    if (channel) {
      supabase.removeChannel(channel)
    }
    setStoreChannel(null)
    if (presenceIntervalRef.current) {
      window.clearInterval(presenceIntervalRef.current)
      presenceIntervalRef.current = null
    }
    clearChat()
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chat...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-red-400">{error}</p>
          {isBanned && (
            <p className="text-sm text-gray-500">
              Contact moderators if you believe this is a mistake
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="chat-container flex h-full flex-col overflow-hidden">
      <MessageList />
      <div className="mt-auto">
        <MessageInput filmId={filmId} channel={channel} />
      </div>
    </div>
  )
}
