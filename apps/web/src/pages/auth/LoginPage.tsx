import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Film, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { login as loginApi } from "../../services/authService"

const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      const result = await loginApi({ identifier: data.identifier, password: data.password })
      setAuth({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      })
      const next = searchParams.get("next")
      navigate(next || "/", { replace: true })
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed"
      const isDbDown =
        typeof message === "string" &&
        (message.includes("Can't reach database server") ||
          message.includes("P1001") ||
          message.includes("ECONNREFUSED"))
      setError(
        isDbDown
          ? "Server is temporarily unavailable. Please try again in a few minutes."
          : message
      )
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(8,8,12)] px-6 py-12">
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Film className="h-5 w-5 text-black" />
            </div>
            <span className="font-['Outfit'] text-xl font-bold text-white">Filmly</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="mb-6 text-center">
            <h1 className="font-['Outfit'] text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 text-sm text-white/50">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email or Username */}
            <div>
              <label
                htmlFor="identifier"
                className="mb-1.5 block text-xs font-medium text-white/60"
              >
                Email or username
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                {...register("identifier")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                placeholder="you@example.com or username"
              />
              {errors.identifier && (
                <p className="mt-1 text-xs text-rose-400">{errors.identifier.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-white/60">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-amber-400 hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-amber-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
