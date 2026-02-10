import { useEffect, useRef, useState } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useChatStore } from "@/stores/chatStore"
import { useAuthStore } from "@/stores/authStore"
import api from "@/services/api"

type MentionUser = {
  id: string
  username: string
  name?: string | null
  avatarUrl?: string | null
}

interface MessageInputProps {
  filmId: number
  channel: RealtimeChannel | null
}

export default function MessageInput({ filmId, channel }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isSpoiler, setIsSpoiler] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSentTime, setLastSentTime] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [mentionQuery, setMentionQuery] = useState("")
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [mentionsOpen, setMentionsOpen] = useState(false)

  const replyTo = useChatStore((state) => state.replyTo)
  const setReplyTo = useChatStore((state) => state.setReplyTo)
  const appUser = useAuthStore((state) => state.user)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)

  const RATE_LIMIT_MS = 2000

  const hasMentions = mentionsOpen && mentionResults.length > 0

  const detectMention = (value: string, cursor: number) => {
    const before = value.slice(0, cursor)
    const match = before.match(/(?:^|\s)@([\w.]*)$/)
    if (!match) {
      setMentionQuery("")
      setMentionsOpen(false)
      return
    }

    const query = match[1]
    setMentionQuery(query)
    setMentionsOpen(true)
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value
    setContent(nextValue)
    detectMention(nextValue, event.target.selectionStart ?? nextValue.length)
  }

  useEffect(() => {
    if (!mentionQuery) {
      setMentionResults([])
      return
    }

    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.get(`/users/search?query=${encodeURIComponent(mentionQuery)}`)
        if (!active) return
        setMentionResults(response.data?.results ?? [])
      } catch {
        if (!active) return
        setMentionResults([])
      }
    }, 200)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [mentionQuery])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!mentionRef.current) return
      if (!mentionRef.current.contains(event.target as Node)) {
        setMentionsOpen(false)
      }
    }
    if (mentionsOpen) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [mentionsOpen])

  const insertMention = (user: MentionUser) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursor = textarea.selectionStart ?? content.length
    const before = content.slice(0, cursor)
    const after = content.slice(cursor)
    const match = before.match(/(?:^|\s)@([\w.]*)$/)
    if (!match) return

    const startIndex = match.index ?? 0
    const prefix = before.slice(0, startIndex)
    const mentionText = `${prefix}${prefix && !prefix.endsWith(" ") ? " " : ""}@${user.username} `
    const nextValue = `${mentionText}${after}`

    setContent(nextValue)
    setMentionQuery("")
    setMentionsOpen(false)

    requestAnimationFrame(() => {
      textarea.focus()
      const newCursor = mentionText.length
      textarea.setSelectionRange(newCursor, newCursor)
    })
  }

  const handleSend = async () => {
    if (!content.trim() || sending) return
    if (content.length > 500) {
      setError("Message too long (max 500 characters)")
      return
    }

    const now = Date.now()
    if (now - lastSentTime < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSentTime)) / 1000)
      setError(`Please wait ${waitTime}s before sending another message`)
      setCountdown(waitTime)
      return
    }

    try {
      setSending(true)
      setError(null)

      const user = appUser
      if (!user) {
        setError("Please log in to send messages")
        return
      }

      const newMessage = {
        id: crypto.randomUUID(),
        content: content.trim(),
        user_id: user.id,
        film_id: filmId,
        parent_id: replyTo?.id || null,
        is_spoiler: isSpoiler,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from("messages").insert(newMessage)
      if (insertError) throw insertError

      if (channel) {
        await channel.send({
          type: "broadcast",
          event: "new_message",
          payload: newMessage,
        })
      }

      setContent("")
      setIsSpoiler(false)
      setReplyTo(null)
      setLastSentTime(now)
    } catch (err) {
      console.error("Send error:", err)
      setError("Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => {
      setCountdown((prev) => {
        const next = prev - 1
        if (next <= 0) setError(null)
        return next
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  return (
    <div className="message-input border-t border-white/10 bg-[rgb(18,18,24)] p-4">
      {replyTo && (
        <div className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
          <div className="flex flex-1 items-start gap-3">
            <div className="mt-1 h-3 w-1 rounded-full bg-amber-400/80" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
                Replying to
              </p>
              <p className="mt-1 truncate text-white/90">{replyTo.content}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyTo(null)}
            className="cursor-pointer rounded-full border border-white/10 p-1 text-white/60 transition hover:border-white/30 hover:text-white"
            aria-label="Cancel reply"
          >
            ✕
          </button>
        </div>
      )}

      <div className="relative">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                placeholder="Share your take..."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[rgb(12,12,16)] p-3 text-sm text-white/90 outline-none focus:border-amber-400/50"
                rows={2}
                maxLength={500}
                disabled={sending || countdown > 0}
              />

              {mentionsOpen && (
                <div
                  ref={mentionRef}
                  className="absolute bottom-full left-0 mb-2 w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-[rgb(18,18,24)] shadow-xl"
                >
                  {hasMentions ? (
                    mentionResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => insertMention(user)}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
                      >
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{user.username}</p>
                          {user.name && <p className="text-xs text-white/50">{user.name}</p>}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-white/40">No users found</div>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-white/60">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(event) => setIsSpoiler(event.target.checked)}
                    className="rounded border-white/10 bg-white/5 text-amber-400 focus:ring-amber-400/40"
                  />
                  Mark as spoiler
                </label>
                <span className={`text-xs ${content.length > 450 ? "text-amber-300" : "text-white/40"}`}>
                  {content.length}/500
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || sending || content.length > 500 || countdown > 0}
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400 text-black transition hover:scale-[1.02] hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              title={countdown > 0 ? `Wait ${countdown}s` : "Send message"}
            >
              {countdown > 0 ? <span className="text-xs">{countdown}s</span> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}

