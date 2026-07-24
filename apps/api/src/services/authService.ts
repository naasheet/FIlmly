import jwt, { JwtPayload } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import crypto from "node:crypto"
import { env } from "../config/env"
import { sendPasswordResetCodeEmail } from "./emailService"

const prisma = new PrismaClient()

type RegisterInput = {
  email: string
  username: string
  password: string
  name?: string
}

type LoginInput = {
  identifier: string
  password: string
}

type TokenPair = {
  accessToken: string
  refreshToken: string
}

const jwtSecret = env.JWT_SECRET
const accessTokenTtlRaw = process.env.ACCESS_TOKEN_TTL ?? "15m"
const refreshTokenTtlRaw = process.env.REFRESH_TOKEN_TTL ?? "7d"
function toPositiveInt(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return Math.floor(parsed)
}

const resetCodeTtlMinutes = Math.max(5, toPositiveInt(process.env.RESET_CODE_TTL_MINUTES, 10))
const resetCodeLength = Math.max(6, toPositiveInt(process.env.RESET_CODE_LENGTH, 6))

function parseDurationToMs(value: string): number {
  if (/^\d+$/.test(value)) {
    return Number(value) * 1000
  }

  const match = value.match(/^(\d+)([smhd])$/i)
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000
  }

  const amount = Number(match[1])
  const unit = match[2].toLowerCase()
  switch (unit) {
    case "s":
      return amount * 1000
    case "m":
      return amount * 60 * 1000
    case "h":
      return amount * 60 * 60 * 1000
    case "d":
      return amount * 24 * 60 * 60 * 1000
    default:
      return 7 * 24 * 60 * 60 * 1000
  }
}

function hashResetCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex")
}

function generateResetCode() {
  const max = 10 ** resetCodeLength
  const code = crypto.randomInt(0, max).toString().padStart(resetCodeLength, "0")
  return code
}

async function findUserByIdentifier(identifier: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }],
    },
  })
}

export async function register(data: RegisterInput) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  })
  if (existing) {
    throw new Error("Email or username already in use")
  }

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      name: data.name,
      passwordHash,
      authProvider: "email",
    },
  })

  const tokens = await generateTokens(user.id)
  return { user, tokens }
}

export async function socialLogin(params: {
  email: string
  name?: string | null
  avatarUrl?: string | null
  authProvider: string
}) {
  let user = await prisma.user.findUnique({ where: { email: params.email } })

  if (user) {
    // Update name/avatar if they were empty
    const updates: Record<string, string> = {}
    if (!user.name && params.name) updates.name = params.name
    if (!user.avatarUrl && params.avatarUrl) updates.avatarUrl = params.avatarUrl
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates })
    }
  } else {
    // Create new user with auto-generated username
    const prefix = params.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "")
    const suffix = Math.floor(1000 + Math.random() * 9000)
    const username = `${prefix}${suffix}`

    user = await prisma.user.create({
      data: {
        email: params.email,
        username,
        name: params.name ?? undefined,
        avatarUrl: params.avatarUrl ?? undefined,
        authProvider: params.authProvider,
      },
    })
  }

  const tokens = await generateTokens(user.id)
  return { user, tokens }
}

export async function login(data: LoginInput) {
  const user = await findUserByIdentifier(data.identifier)
  if (!user) {
    throw new Error("Invalid credentials")
  }

  if (!user.passwordHash) {
    throw new Error(
      "This account uses social login. Please sign in with Google/Apple or use 'Forgot password' to set a password."
    )
  }

  const isValid = await bcrypt.compare(data.password, user.passwordHash)
  if (!isValid) {
    throw new Error("Invalid credentials")
  }

  const tokens = await generateTokens(user.id)
  return { user, tokens }
}

export async function generateTokens(userId: string): Promise<TokenPair> {
  const accessTokenTtlSeconds = Math.max(1, Math.floor(parseDurationToMs(accessTokenTtlRaw) / 1000))
  const accessToken = jwt.sign({ sub: userId, type: "access" }, jwtSecret, {
    expiresIn: accessTokenTtlSeconds,
  })

  const refreshToken = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + parseDurationToMs(refreshTokenTtlRaw))

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt,
    },
  })

  return { accessToken, refreshToken }
}

export async function refreshAccessToken(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { token },
  })
  if (!stored || stored.revoked) {
    throw new Error("Invalid refresh token")
  }
  if (stored.expiresAt < new Date()) {
    throw new Error("Refresh token expired")
  }

  const accessTokenTtlSeconds = Math.max(1, Math.floor(parseDurationToMs(accessTokenTtlRaw) / 1000))
  const accessToken = jwt.sign({ sub: stored.userId, type: "access" }, jwtSecret, {
    expiresIn: accessTokenTtlSeconds,
  })
  return { accessToken }
}

export async function logout(token: string) {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  })
  return { success: true }
}

export function verifyToken(token: string) {
  return jwt.verify(token, jwtSecret) as JwtPayload
}

export async function requestPasswordReset(identifier: string) {
  const user = await findUserByIdentifier(identifier)
  if (!user) {
    return { sent: false }
  }

  await prisma.passwordResetCode.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  })

  const code = generateResetCode()
  const expiresAt = new Date(Date.now() + resetCodeTtlMinutes * 60 * 1000)

  await prisma.passwordResetCode.create({
    data: {
      userId: user.id,
      codeHash: hashResetCode(code),
      expiresAt,
    },
  })

  await sendPasswordResetCodeEmail({
    toEmail: user.email,
    toName: user.name,
    code,
    minutesValid: resetCodeTtlMinutes,
  })

  return { sent: true }
}

export async function resetPassword(params: {
  identifier: string
  code: string
  newPassword: string
}) {
  const user = await findUserByIdentifier(params.identifier)
  if (!user) {
    throw new Error("Invalid reset request")
  }

  const codeHash = hashResetCode(params.code.trim())
  const resetRecord = await prisma.passwordResetCode.findFirst({
    where: {
      userId: user.id,
      codeHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  })

  if (!resetRecord) {
    throw new Error("Invalid or expired code")
  }

  const passwordHash = await bcrypt.hash(params.newPassword, 10)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.passwordResetCode.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    }),
  ])

  return { success: true }
}
