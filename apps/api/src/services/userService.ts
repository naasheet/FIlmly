import { ContributorRole, PrismaClient } from "@prisma/client"
import crypto from "crypto"
import { getUserReviews as listUserReviews } from "./reviewService"
import { listWatchlists } from "./watchlistService"

const prisma = new PrismaClient()

type UpdateProfileInput = {
  name?: string | null
  username?: string | null
  bio?: string | null
  avatarUrl?: string | null
  coverImageUrl?: string | null
  location?: string | null
  website?: string | null
  instagram?: string | null
  twitter?: string | null
  privateProfile?: boolean
  hideReviews?: boolean
}

type UploadFileInput = {
  buffer: Buffer
  mimetype: string
  originalName?: string
}

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary configuration")
  }
  return { cloudName, apiKey, apiSecret }
}

async function uploadToCloudinary(file: UploadFileInput, publicId: string) {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = "avatars"
  const overwrite = "true"

  const signatureBase = `folder=${folder}&overwrite=${overwrite}&public_id=${publicId}&timestamp=${timestamp}`
  const signature = crypto
    .createHash("sha1")
    .update(signatureBase + apiSecret)
    .digest("hex")

  const form = new FormData()
  form.append(
    "file",
    new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype }),
    file.originalName
  )
  form.append("api_key", apiKey)
  form.append("timestamp", String(timestamp))
  form.append("folder", folder)
  form.append("public_id", publicId)
  form.append("overwrite", overwrite)
  form.append("signature", signature)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: form,
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Cloudinary upload failed (${response.status}): ${body}`)
  }

  return (await response.json()) as { secure_url?: string }
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      supabaseUserId: true,
      name: true,
      bio: true,
      avatarUrl: true,
      coverImageUrl: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      privateProfile: true,
      hideReviews: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

export async function getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      email: true,
      username: true,
      supabaseUserId: true,
      name: true,
      bio: true,
      avatarUrl: true,
      coverImageUrl: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      privateProfile: true,
      hideReviews: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      supabaseUserId: true,
      name: true,
      bio: true,
      avatarUrl: true,
      coverImageUrl: true,
      location: true,
      website: true,
      instagram: true,
      twitter: true,
      privateProfile: true,
      hideReviews: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name ?? undefined,
        username: data.username ?? undefined,
        bio: data.bio ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        coverImageUrl: data.coverImageUrl ?? undefined,
        location: data.location ?? undefined,
        website: data.website ?? undefined,
        instagram: data.instagram ?? undefined,
        twitter: data.twitter ?? undefined,
        privateProfile: data.privateProfile ?? undefined,
        hideReviews: data.hideReviews ?? undefined,
      },
    })
  } catch (error: any) {
    if (error?.code === "P2002") {
      throw new Error("Username already taken")
    }
    throw error
  }
}

export async function linkSupabaseUserId(userId: string, supabaseUserId: string) {
  const existing = await prisma.user.findFirst({
    where: {
      supabaseUserId,
      NOT: { id: userId },
    },
    select: { id: true },
  })
  if (existing) {
    throw new Error("Supabase user already linked to another account")
  }

  return prisma.user.update({
    where: { id: userId },
    data: { supabaseUserId },
    select: {
      id: true,
      email: true,
      username: true,
      supabaseUserId: true,
      name: true,
      avatarUrl: true,
    },
  })
}

export async function uploadAvatar(userId: string, file: UploadFileInput) {
  const result = await uploadToCloudinary(file, `user_${userId}`)
  if (!result.secure_url) {
    throw new Error("Cloudinary did not return a secure URL")
  }

  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: result.secure_url },
  })
}

export async function getUserStats(userId: string) {
  const [reviews, ratings, watchlists, watchlistItems, watched, averageRating] =
    await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.rating.count({ where: { userId } }),
      prisma.watchlist.count({ where: { userId } }),
      prisma.watchlistItem.count({ where: { watchlist: { userId } } }),
      prisma.watched.count({ where: { userId } }),
      prisma.review.aggregate({
        where: { userId },
        _avg: { rating: true },
      }),
    ])

  return {
    reviewCount: reviews,
    ratingCount: ratings,
    watchlistCount: watchlists,
    watchlistItemCount: watchlistItems,
    watchedCount: watched,
    averageRating: averageRating._avg.rating ?? null,
  }
}

export async function getUserReviews(userId: string) {
  return listUserReviews(userId)
}

export async function getUserLists(userId: string) {
  const [created, collaborating, liked, saved] = await Promise.all([
    prisma.list.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        user: { select: { id: true, username: true, name: true, avatarUrl: true } },
        films: { take: 4, include: { film: true } },
      },
    }),
    prisma.listContributor.findMany({
      where: {
        userId,
        status: "ACCEPTED",
        role: { in: [ContributorRole.EDITOR, ContributorRole.CONTRIBUTOR] },
      },
      include: {
        list: {
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
            films: { take: 4, include: { film: true } },
          },
        },
      },
    }),
    prisma.listLike.findMany({
      where: { userId },
      include: {
        list: {
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
            films: { take: 4, include: { film: true } },
          },
        },
      },
    }),
    prisma.listSave.findMany({
      where: { userId },
      include: {
        list: {
          include: {
            user: { select: { id: true, username: true, name: true, avatarUrl: true } },
            films: { take: 4, include: { film: true } },
          },
        },
      },
    }),
  ])

  return {
    created,
    collaborating: collaborating.map((item) => item.list),
    liked: liked.map((item) => item.list),
    saved: saved.map((item) => item.list),
  }
}
