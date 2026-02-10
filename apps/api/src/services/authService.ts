import jwt, { JwtPayload } from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"
import crypto from "node:crypto"
import { env } from "../config/env"

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
    },
  })

  const tokens = await generateTokens(user.id)
  return { user, tokens }
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.identifier }, { username: data.identifier }],
    },
  })
  if (!user) {
    throw new Error("Invalid credentials")
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
