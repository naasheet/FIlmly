import { Router } from "express"
import { body, validationResult } from "express-validator"
import {
  login,
  logout,
  refreshAccessToken,
  register,
  requestPasswordReset,
  resetPassword,
  socialLogin,
} from "../services/authService"
import { supabaseAdmin } from "../config/supabaseAdmin"

const router = Router()
const resetCodeLengthRaw = Number(process.env.RESET_CODE_LENGTH ?? "6")
const resetCodeLength = Number.isFinite(resetCodeLengthRaw)
  ? Math.max(6, Math.floor(resetCodeLengthRaw))
  : 6

const validate = (req: Parameters<typeof router.post>[1], res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  return next()
}

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("username").isString().isLength({ min: 3, max: 30 }),
    body("password").isString().isLength({ min: 8 }),
    body("name").optional().isString().isLength({ min: 2 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, username, password, name } = req.body
      const result = await register({ email, username, password, name })
      return res.status(201).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Registration failed" })
    }
  }
)

router.post(
  "/login",
  [body("identifier").isString().trim(), body("password").isString()],
  validate,
  async (req, res) => {
    try {
      const { identifier, password } = req.body
      const result = await login({ identifier, password })
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(401).json({ message: error.message ?? "Invalid credentials" })
    }
  }
)

router.post(
  "/refresh",
  [body("refreshToken").isString().isLength({ min: 10 })],
  validate,
  async (req, res) => {
    try {
      const { refreshToken } = req.body
      const result = await refreshAccessToken(refreshToken)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(401).json({ message: error.message ?? "Invalid refresh token" })
    }
  }
)

router.post(
  "/logout",
  [body("refreshToken").isString().isLength({ min: 10 })],
  validate,
  async (req, res) => {
    try {
      const { refreshToken } = req.body
      const result = await logout(refreshToken)
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Logout failed" })
    }
  }
)

router.post(
  "/forgot-password",
  [body("identifier").isString().trim().isLength({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const { identifier } = req.body
      await requestPasswordReset(identifier)
      return res.status(200).json({
        message: "If an account exists, a reset code has been sent to the email on file.",
      })
    } catch (error: any) {
      return res.status(500).json({ message: error.message ?? "Unable to send reset code" })
    }
  }
)

router.post(
  "/reset-password",
  [
    body("identifier").isString().trim().isLength({ min: 1 }),
    body("code")
      .isString()
      .trim()
      .matches(new RegExp(`^\\d{${resetCodeLength}}$`)),
    body("newPassword").isString().isLength({ min: 8 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { identifier, code, newPassword } = req.body
      const result = await resetPassword({ identifier, code, newPassword })
      return res.status(200).json(result)
    } catch (error: any) {
      return res.status(400).json({ message: error.message ?? "Reset failed" })
    }
  }
)

router.post(
  "/social",
  [
    body("accessToken").isString().isLength({ min: 10 }),
    body("provider").isString().isIn(["google", "apple"]),
  ],
  validate,
  async (req, res) => {
    try {
      const { accessToken, provider } = req.body

      // Verify token with Supabase
      const {
        data: { user: supaUser },
        error: supaError,
      } = await supabaseAdmin.auth.getUser(accessToken)

      if (supaError || !supaUser || !supaUser.email) {
        return res.status(401).json({ message: "Invalid social login token" })
      }

      const meta = supaUser.user_metadata ?? {}
      const result = await socialLogin({
        email: supaUser.email,
        name: meta.full_name || meta.name || null,
        avatarUrl: meta.avatar_url || meta.picture || null,
        authProvider: provider,
      })

      return res.status(200).json(result)
    } catch (error: any) {
      return res
        .status(400)
        .json({ message: error.message ?? "Social login failed" })
    }
  }
)

export default router
