import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { usePageTitle } from "../../hooks/usePageTitle"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Mail } from "lucide-react"
import { requestPasswordReset, resetPassword } from "../../services/authService"

const requestSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
})

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

type RequestFormData = z.infer<typeof requestSchema>
type ResetFormData = z.infer<typeof resetSchema>

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password")
  const navigate = useNavigate()
  const [step, setStep] = useState<"request" | "reset" | "done">("request")
  const [identifier, setIdentifier] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors, isSubmitting: isRequesting },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
  })

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: isResetting },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  })

  const onRequest = async (data: RequestFormData) => {
    setError(null)
    setInfo(null)
    try {
      const trimmed = data.identifier.trim()
      await requestPasswordReset(trimmed)
      setIdentifier(trimmed)
      setInfo("If an account exists, a reset code has been sent to the email on file.")
      setStep("reset")
    } catch (err: any) {
      setError(err?.message || "Unable to send reset code")
    }
  }

  const onReset = async (data: ResetFormData) => {
    setError(null)
    setInfo(null)
    try {
      await resetPassword({
        identifier,
        code: data.code,
        newPassword: data.newPassword,
      })
      setStep("done")
    } catch (err: any) {
      setError(err?.message || "Reset failed")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(8,8,12)] px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(14,14,18)] p-1">
              <img src="/assets/logo.png" alt="Filmly logo" className="h-full w-full object-contain" />
            </div>
            <span className="font-['Outfit'] text-xl font-bold text-white">Filmly</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8">
          <div className="mb-6 text-center">
            <h1 className="font-['Outfit'] text-2xl font-bold text-white">
              {step === "done" ? "Password reset" : "Forgot password"}
            </h1>
            <p className="mt-1 text-sm text-white/50">
              {step === "request" && "We’ll email you a reset code"}
              {step === "reset" && "Enter the code and choose a new password"}
              {step === "done" && "You can now sign in with your new password"}
            </p>
          </div>

          {step === "request" && (
            <form onSubmit={handleRequestSubmit(onRequest)} className="space-y-4">
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
                  {...registerRequest("identifier")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                  placeholder="you@example.com or username"
                />
                {requestErrors.identifier && (
                  <p className="mt-1 text-xs text-rose-400">
                    {requestErrors.identifier.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={isRequesting}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRequesting ? "Sending code..." : "Send reset code"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetSubmit(onReset)} className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                <Mail className="mr-2 inline-block h-4 w-4 text-amber-300" />
                Code sent to the email on file for <span className="text-white">{identifier}</span>.
              </div>

              <div>
                <label htmlFor="code" className="mb-1.5 block text-xs font-medium text-white/60">
                  Reset code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...registerReset("code")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm tracking-[0.3em] text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                  placeholder="000000"
                />
                {resetErrors.code && (
                  <p className="mt-1 text-xs text-rose-400">{resetErrors.code.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-xs font-medium text-white/60"
                >
                  New password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...registerReset("newPassword")}
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
                {resetErrors.newPassword && (
                  <p className="mt-1 text-xs text-rose-400">
                    {resetErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-xs font-medium text-white/60"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  {...registerReset("confirmPassword")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-amber-400/50 focus:bg-white/10"
                  placeholder="Repeat your new password"
                />
                {resetErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-400">
                    {resetErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={isResetting}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isResetting ? "Resetting..." : "Reset password"}
              </button>

              <button
                type="button"
                onClick={() => onRequest({ identifier })}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/10"
              >
                Resend code
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Your password has been updated.
              </div>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="w-full rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-300"
              >
                Go to login
              </button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-white/50">
            Remembered your password?{" "}
            <Link to="/login" className="font-medium text-amber-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
