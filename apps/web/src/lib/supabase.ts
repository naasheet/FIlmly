import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Helper to check if user is banned
export const isUserBanned = async (userId: string, filmId: number) => {
  const { data } = await supabase.rpc("is_user_banned", {
    p_user_id: userId,
    p_film_id: filmId,
  })
  return data
}

export interface Message {
  id: string
  content: string
  user_id: string
  film_id: number
  parent_id: string | null
  is_edited: boolean
  is_spoiler: boolean
  created_at: string
  reactions?: Reaction[]
}

export interface Reaction {
  emoji: string
  user_id: string
}

export interface OnlineUser {
  user_id: string
  film_id: number
  last_seen: string
}
