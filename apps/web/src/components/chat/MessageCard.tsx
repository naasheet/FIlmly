import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import type { Message, Reaction } from "@/lib/supabase"
import api from "@/services/api"
import { useChatStore } from "@/stores/chatStore"

type MessageCardProps = {
  message: Message
  displayName?: string
  avatarUrl?: string | null
  isOwn?: boolean
  userMap?: Record<string, { name: string; avatarUrl?: string | null; username?: string | null }>
  currentUserId?: string | null
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👎"]

export default function MessageCard({
  message,
  displayName,
  avatarUrl,
  isOwn = false,
  userMap = {},
  currentUserId = null,
}: MessageCardProps) {
  const [showSpoiler, setShowSpoiler] = useState(!message.is_spoiler)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const [saving, setSaving] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionRef = useRef<HTMLDivElement>(null)

  const createdLabel = format(new Date(message.created_at), "h:mm a")
  const initials = (displayName ?? message.user_id).substring(0, 2).toUpperCase()

  const setReplyTo = useChatStore((state) => state.setReplyTo)
  const updateMessage = useChatStore((state) => state.updateMessage)
  const removeMessage = useChatStore((state) => state.removeMessage)
  const channel = useChatStore((state) => state.channel)
  const messages = useChatStore((state) => state.messages)

  const parentMessage = useMemo(() => {
    if (!message.parent_id) return null
    return messages.find((msg) => msg.id === message.parent_id) ?? null
  }, [messages, message.parent_id])

  const parentDisplayName = parentMessage
    ? parentMessage.user_id === currentUserId
      ? "You"
      : userMap[parentMessage.user_id]?.name ??
        userMap[parentMessage.user_id]?.username ??
        "Loading..."
    : null

  const senderUsername = userMap[message.user_id]?.username ?? null
  const profilePath = senderUsername ? `/users/${senderUsername}` : `/users/${message.user_id}`

  const mentionUsernames = useMemo(() => {
    return new Set(
      Object.values(userMap)
        .map((user) => user.username)
        .filter((value): value is string => Boolean(value))
    )
  }, [userMap])

  const contentWithMentions = useMemo(() => {
    if (!message.content) return ""
    return message.content.replace(/@([A-Za-z0-9._]+)/g, (match, username) => {
      if (mentionUsernames.has(username)) {
        return `[@${username}](/users/${username})`
      }
      return match
    })
  }, [message.content, mentionUsernames])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!reactionRef.current) return
      if (!reactionRef.current.contains(event.target as Node)) {
        setShowReactions(false)
      }
    }
    if (showReactions) {
      document.addEventListener("mousedown", handleClick)
    }
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showReactions])

  useEffect(() => {
    if (!editing) {
      setEditValue(message.content)
    }
  }, [message.content, editing])

  const broadcastUpdate = async (updates: Partial<Message>) => {
    if (!channel) return
    await channel.send({
      type: "broadcast",
      event: "update_message",
      payload: { id: message.id, updates },
    })
  }

  const broadcastDelete = async () => {
    if (!channel) return
    await channel.send({
      type: "broadcast",
      event: "delete_message",
      payload: { id: message.id },
    })
  }

  const broadcastReaction = async (emoji: string, action: "add_reaction" | "remove_reaction") => {
    if (!channel) return
    await channel.send({
      type: "broadcast",
      event: action,
      payload: { messageId: message.id, emoji, userId: currentUserId },
    })
  }

  const handleReply = () => {
    setReplyTo(message)
    setMenuOpen(false)
  }

  const handleEdit = () => {
    setEditing(true)
    setMenuOpen(false)
  }

  const handleSave = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || saving) return

    try {
      setSaving(true)
      const response = await api.patch(`/chat/messages/${message.id}`, {
        content: trimmed,
        is_spoiler: message.is_spoiler,
      })
      const updated = response.data
      updateMessage(message.id, {
        content: updated.content,
        is_edited: updated.is_edited,
      })
      await broadcastUpdate({ content: updated.content, is_edited: updated.is_edited })
      setEditing(false)
    } catch (error) {
      console.error("Failed to edit message", error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await api.delete(`/chat/messages/${message.id}`)
      removeMessage(message.id)
      await broadcastDelete()
    } catch (error) {
      console.error("Failed to delete message", error)
    } finally {
      setConfirmOpen(false)
      setMenuOpen(false)
    }
  }

  const handleReport = () => {
    setMenuOpen(false)
    window.alert("Reported. Thanks for letting us know.")
  }

  const handleReactionClick = async (emoji: string) => {
    if (!currentUserId) return
    const existing = message.reactions ?? []
    const currentReaction = existing.find((reaction) => reaction.user_id === currentUserId)
    const hasReacted = currentReaction?.emoji === emoji
    const withoutUser = existing.filter((reaction) => reaction.user_id !== currentUserId)
    const next = hasReacted ? withoutUser : [...withoutUser, { emoji, user_id: currentUserId }]

    updateMessage(message.id, { reactions: next })

    try {
      await api.patch(`/chat/messages/${message.id}/reactions`, { reactions: next })
    } catch (error) {
      console.error("Failed to update reaction", error)
      return
    }

    await broadcastReaction(emoji, hasReacted ? "remove_reaction" : "add_reaction")
    setShowReactions(false)
  }

  const groupedReactions = useMemo(() => groupReactions(message.reactions || []), [message.reactions])

  const reactionBlock = (
    <div className="relative flex flex-col items-center gap-2 pt-1" ref={reactionRef}>
      <button
        type="button"
        onClick={() => setShowReactions((prev) => !prev)}
        className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-2 py-1 text-sm text-white/70 transition hover:bg-white/10"
      >
        🙂
      </button>
      {showReactions && (
        <div
          className={`absolute bottom-full mb-2 flex items-center gap-1 rounded-full border border-white/10 bg-[rgb(18,18,24)] px-2 py-1 shadow-xl ${
            isOwn ? "left-0" : "right-0"
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => {
            const reacted = (message.reactions || []).some(
              (reaction) => reaction.emoji === emoji && reaction.user_id === currentUserId
            )
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleReactionClick(emoji)}
                className={`cursor-pointer rounded-full px-2 py-1 text-sm transition ${
                  reacted
                    ? "bg-amber-400/20 text-amber-200"
                    : "text-white/70 hover:bg-white/10"
                }`}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      )}
      {Object.keys(groupedReactions).length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {Object.entries(groupedReactions).map(([emoji, users]) => (
            <button
              key={emoji}
              type="button"
              className="cursor-pointer rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
            >
              {emoji} {users.length}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className={`group flex w-full ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className={`flex max-w-[85%] items-start gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
          {!isOwn && (
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amber-500 text-sm font-semibold text-black">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName ?? "User"} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
          )}

          <div className="flex items-start gap-2">
            {isOwn ? (
              <>
                <div className="mt-6">{reactionBlock}</div>
                <div className="flex flex-col gap-1">
                  {renderBubble()}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1">
                  {renderBubble()}
                </div>
                <div className="mt-6">{reactionBlock}</div>
              </>
            )}
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Delete message?</h3>
            <p className="mt-2 text-sm text-white/60">This action can’t be undone.</p>
            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  function renderBubble() {
    return (
      <div
        className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
          isOwn
            ? "rounded-br-sm border-amber-400/30 bg-amber-400/10 text-amber-50"
            : "rounded-bl-sm border-white/10 bg-white/5 text-white/80"
        }`}
      >
        <div className={`mb-2 flex items-start justify-between gap-3 ${isOwn ? "text-right" : ""}`}>
          <div>
            <span className={`font-medium ${isOwn ? "text-amber-100" : "text-white"}`}>
              {isOwn ? "You" : displayName ?? "Loading..."}
            </span>
            <span className="ml-2 text-xs text-white/40">{createdLabel}</span>
            {message.is_edited && <span className="ml-2 text-xs text-white/30">(edited)</span>}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className="cursor-pointer text-white/50 opacity-0 transition group-hover:opacity-100"
              aria-label="Message actions"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              •••
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-6 z-20 w-40 rounded-xl border border-white/10 bg-[rgb(18,18,24)] p-2 text-xs shadow-xl">
                <button
                  type="button"
                  onClick={handleReply}
                  className="w-full rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/10"
                >
                  Reply
                </button>
                {isOwn ? (
                  <>
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmOpen(true)
                        setMenuOpen(false)
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false)
                        window.location.href = profilePath
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-white/80 hover:bg-white/10"
                    >
                      View profile
                    </button>
                    <button
                      type="button"
                      onClick={handleReport}
                      className="w-full rounded-lg px-3 py-2 text-left text-red-300 hover:bg-red-500/10"
                    >
                      Report
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          {parentMessage && (
            <div className="mb-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
              Replying to <span className="font-semibold text-white/80">{parentDisplayName}</span>: {parentMessage.content}
            </div>
          )}
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(event) => setEditValue(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/40 p-2 text-sm text-white/90 outline-none focus:border-amber-400/60"
              />
              <div className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false)
                    setEditValue(message.content)
                  }}
                  className="rounded-lg px-3 py-1 text-xs text-white/60 hover:bg-white/10"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-lg bg-amber-400/80 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400"
                  disabled={saving || !editValue.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.is_spoiler && !showSpoiler ? (
                <button
                  type="button"
                  onClick={() => setShowSpoiler(true)}
                  className="cursor-pointer text-sm text-orange-400 hover:text-orange-300"
                >
                  [Spoiler - Click to reveal]
                </button>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <Link
                          to={href ?? "#"}
                          className="text-amber-300 underline decoration-amber-400/50 underline-offset-2 hover:text-amber-200"
                        >
                          {children}
                        </Link>
                      ),
                    }}
                  >
                    {contentWithMentions}
                  </ReactMarkdown>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }
}

function groupReactions(reactions: Reaction[]) {
  return reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction.user_id)
    return acc
  }, {} as Record<string, string[]>)
}
