import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../../stores/authStore"
import { socialLogin } from "../../services/authService"
import { supabase } from "../../lib/supabase"

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase stores the session in the URL hash after OAuth redirect
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !data.session) {
          setError("Authentication failed. Please try again.")
          return
        }

        const { access_token } = data.session
        const provider =
          data.session.user?.app_metadata?.provider || "google"

        // Exchange the Supabase token for our app's JWT tokens
        const result = await socialLogin(access_token, provider)

        setAuth({
          user: result.user,
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
        })

        navigate("/", { replace: true })
      } catch (err: any) {
        setError(err?.message || "Social login failed. Please try again.")
      }
    }

    handleCallback()
  }, [navigate, setAuth])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(8,8,12)] px-6">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-300">
              {error}
            </div>
            <button
              onClick={() => navigate("/login")}
              className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Back to login
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <p className="text-sm text-white/50">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  )
}
