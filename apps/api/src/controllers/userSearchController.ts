import type { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function searchUsersHandler(req: Request, res: Response) {
  try {
    const query = String(req.query.query ?? "").trim()
    if (!query) {
      return res.status(200).json({ results: [] })
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { username: "asc" },
      take: 20,
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
      },
    })

    return res.status(200).json({ results: users })
  } catch (error: any) {
    return res.status(500).json({ message: error.message ?? "Failed to search users" })
  }
}
