import { createClient } from "@supabase/supabase-js"
import { env } from "../config/env"

const supabaseUrl = env.SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase admin env vars are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.")
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})
