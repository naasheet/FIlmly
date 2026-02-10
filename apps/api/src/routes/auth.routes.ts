import { Router } from "express"
import { body, validationResult } from "express-validator"
import {
  login,
  logout,
  refreshAccessToken,
  register,
} from "../services/authService"

const router = Router()

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

export default router
