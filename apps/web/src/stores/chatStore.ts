import { create } from "zustand"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Message, OnlineUser } from "../lib/supabase"

interface ChatStore {
  // State
  currentFilmId: number | null
  messages: Message[]
  onlineUsers: OnlineUser[]
  isConnected: boolean
  replyTo: Message | null
  channel: RealtimeChannel | null

  // Actions
  setFilmId: (filmId: number) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, updates: Partial<Message>) => void
  removeMessage: (id: string) => void
  setMessages: (messages: Message[]) => void
  addReaction: (messageId: string, emoji: string, userId: string) => void
  removeReaction: (messageId: string, emoji: string, userId: string) => void
  setOnlineUsers: (users: OnlineUser[]) => void
  setReplyTo: (message: Message | null) => void
  setConnected: (connected: boolean) => void
  setChannel: (channel: RealtimeChannel | null) => void
  clearChat: () => void
}

export const useChatStore = create<ChatStore>((set) => ({
  currentFilmId: null,
  messages: [],
  onlineUsers: [],
  isConnected: false,
  replyTo: null,
  channel: null,

  setFilmId: (filmId) => set({ currentFilmId: filmId }),

  addMessage: (message) =>
    set((state) => {
      if (state.messages.some((msg) => msg.id === message.id)) {
        return state
      }
      return { messages: [message, ...state.messages] }
    }),

  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    })),

  removeMessage: (id) =>
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    })),

  setMessages: (messages) => set({ messages }),

  addReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || []
          if (reactions.some((reaction) => reaction.emoji === emoji && reaction.user_id === userId)) {
            return msg
          }
          return {
            ...msg,
            reactions: [...reactions, { emoji, user_id: userId }],
          }
        }
        return msg
      }),
    })),

  removeReaction: (messageId, emoji, userId) =>
    set((state) => ({
      messages: state.messages.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: (msg.reactions || []).filter(
              (reaction) => !(reaction.emoji === emoji && reaction.user_id === userId)
            ),
          }
        }
        return msg
      }),
    })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),
  setReplyTo: (message) => set({ replyTo: message }),
  setConnected: (connected) => set({ isConnected: connected }),
  setChannel: (channel) => set({ channel }),
  clearChat: () =>
    set({
      messages: [],
      onlineUsers: [],
      replyTo: null,
      isConnected: false,
      channel: null,
    }),
}))
