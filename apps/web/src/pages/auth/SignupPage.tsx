import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Film, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import { register as registerApi } from "../../services/authService"

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username is too long"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    if (user) navigate("/", { replace: true })
  }, [user, navigate])

  const onSubmit = async (data: SignupFormData) => {
    setError(null)
    try {
      const result = await registerApi({
        name: data.name,
        email: data.email,
        username: data.username,
        password: data.password,
      })
      setAuth({
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      })
      navigate("/", { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Registration failed")
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
            <h1 className="font-['Outfit'] text-2xl font-bold text-white">Create account</h1>
            <p className="mt-1 text-sm text-white/50">Start your film journey</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-white/60">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                {...register("name")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                placeholder="Your name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-400">{errors.name.message}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-white/60">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                {...register("username")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                placeholder="Choose a username"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-rose-400">{errors.username.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-white/60">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-white/60">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...register("password")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                  placeholder="Min. 8 characters"
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
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-white/50">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-amber-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
