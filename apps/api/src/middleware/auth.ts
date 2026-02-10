import type { NextFunction, Request, Response } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"
import { env } from "../config/env"

const prisma = new PrismaClient()
const jwtSecret = env.JWT_SECRET

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme !== "Bearer" || !token) return null
  return token
}

async function attachUser(
  req: Request,
  res: Response,
  next: NextFunction,
  { required }: { required: boolean }
) {
  const token = getBearerToken(req)
  if (!token) {
    if (required) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    return next()
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    if (payload.type && payload.type !== "access") {
      throw new Error("Invalid token type")
    }
    const userId = payload.sub
    if (!userId) {
      throw new Error("Invalid token")
    }

    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
    })
    if (!user) {
      if (required) {
        return res.status(401).json({ message: "Unauthorized" })
      }
      return next()
    }

    req.user = user
    return next()
  } catch {
    if (required) {
      return res.status(401).json({ message: "Unauthorized" })
    }
    return next()
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  return attachUser(req, res, next, { required: true })
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  return attachUser(req, res, next, { required: false })
}
