// ─────────────────────────────────────────────────────────────────────────────
// Achievement tier definitions & calculation helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface AchievementTier {
    level: number
    title: string
    emoji: string
    description: string
    color: string        // hex for border / accent
    glowColor: string    // rgba for box-shadow glow
    iconColor: string    // hex for the inner icon tint
    minCount: number
}

export interface AchievementProgress {
    level: number
    tier: AchievementTier
    currentProgress: number   // how many into the current tier
    nextTarget: number        // total needed for the NEXT tier
    progressToNext: number    // remaining to next tier
    percentage: number        // 0 – 100
    totalCount: number
    isMaxLevel: boolean
}

// ── Watched Films ── every 50 ────────────────────────────────────────────────

export const WATCHED_TIERS: AchievementTier[] = [
    {
        level: 1,
        title: "Film Newbie",
        emoji: "🎞️",
        description: "Starting your cinema journey",
        color: "#6b7280",
        glowColor: "rgba(107,114,128,0.0)",
        iconColor: "rgba(255,255,255,0.3)",
        minCount: 0,
    },
    {
        level: 2,
        title: "Casual Viewer",
        emoji: "🎬",
        description: "50 films watched!",
        color: "#CD7F32",
        glowColor: "rgba(205,127,50,0.35)",
        iconColor: "#FFA94D",
        minCount: 50,
    },
    {
        level: 3,
        title: "Cinema Enthusiast",
        emoji: "🍿",
        description: "100 films! You're hooked",
        color: "#C0C0C0",
        glowColor: "rgba(192,192,192,0.4)",
        iconColor: "#E8E8E8",
        minCount: 100,
    },
    {
        level: 4,
        title: "Film Buff",
        emoji: "🎥",
        description: "150 films and counting",
        color: "#FFD700",
        glowColor: "rgba(255,215,0,0.5)",
        iconColor: "#FFF4CC",
        minCount: 150,
    },
    {
        level: 5,
        title: "Cinephile",
        emoji: "🎬",
        description: "200 films! True passion",
        color: "#E5E4E2",
        glowColor: "rgba(229,228,226,0.6)",
        iconColor: "#FFFFFF",
        minCount: 200,
    },
    {
        level: 6,
        title: "Film Connoisseur",
        emoji: "💎",
        description: "250 films mastered",
        color: "#B9F2FF",
        glowColor: "rgba(185,242,255,0.7)",
        iconColor: "#E0F7FF",
        minCount: 250,
    },
    {
        level: 7,
        title: "Cinema Legend",
        emoji: "📽️",
        description: "300 films! Legendary status",
        color: "#7C3AED",
        glowColor: "rgba(124,58,237,0.6)",
        iconColor: "#C4B5FD",
        minCount: 300,
    },
    {
        level: 8,
        title: "Master Curator",
        emoji: "🏆",
        description: "Ultimate film master",
        color: "#EC4899",
        glowColor: "rgba(236,72,153,0.6)",
        iconColor: "#F9A8D4",
        minCount: 350,
    },
]

// ── Reviews ── every 20 ──────────────────────────────────────────────────────

export const REVIEW_TIERS: AchievementTier[] = [
    {
        level: 1,
        title: "Silent Observer",
        emoji: "✏️",
        description: "Start sharing your thoughts",
        color: "#6b7280",
        glowColor: "rgba(107,114,128,0.0)",
        iconColor: "rgba(255,255,255,0.3)",
        minCount: 0,
    },
    {
        level: 2,
        title: "Voice Emerging",
        emoji: "📝",
        description: "20 reviews shared!",
        color: "#CD7F32",
        glowColor: "rgba(205,127,50,0.35)",
        iconColor: "#FFA94D",
        minCount: 20,
    },
    {
        level: 3,
        title: "Active Critic",
        emoji: "⌨️",
        description: "40 reviews! Your voice matters",
        color: "#C0C0C0",
        glowColor: "rgba(192,192,192,0.4)",
        iconColor: "#E8E8E8",
        minCount: 40,
    },
    {
        level: 4,
        title: "Trusted Reviewer",
        emoji: "🖊️",
        description: "60 reviews! Building influence",
        color: "#FFD700",
        glowColor: "rgba(255,215,0,0.5)",
        iconColor: "#FFF4CC",
        minCount: 60,
    },
    {
        level: 5,
        title: "Film Critic",
        emoji: "📜",
        description: "80 reviews! Expert opinion",
        color: "#E5E4E2",
        glowColor: "rgba(229,228,226,0.6)",
        iconColor: "#FFFFFF",
        minCount: 80,
    },
    {
        level: 6,
        title: "Master Critic",
        emoji: "🪶",
        description: "100+ reviews! Critical master",
        color: "#7C3AED",
        glowColor: "rgba(124,58,237,0.6)",
        iconColor: "#C4B5FD",
        minCount: 100,
    },
]

// ── Calculation helpers ──────────────────────────────────────────────────────

function calculateLevel(
    count: number,
    tiers: AchievementTier[],
    step: number,
): AchievementProgress {
    const maxLevel = tiers.length
    const rawLevel = Math.floor(count / step) + 1
    const level = Math.min(rawLevel, maxLevel)
    const tier = tiers[level - 1]
    const isMaxLevel = level >= maxLevel

    const currentProgress = isMaxLevel ? count - tier.minCount : count % step
    const nextTarget = isMaxLevel ? tier.minCount : Math.ceil((count + 1) / step) * step
    const progressToNext = isMaxLevel ? 0 : nextTarget - count
    const percentage = isMaxLevel ? 100 : (currentProgress / step) * 100

    return {
        level,
        tier,
        currentProgress,
        nextTarget,
        progressToNext,
        percentage,
        totalCount: count,
        isMaxLevel,
    }
}

export function calculateWatchedLevel(filmCount: number): AchievementProgress {
    return calculateLevel(filmCount, WATCHED_TIERS, 50)
}

export function calculateReviewLevel(reviewCount: number): AchievementProgress {
    return calculateLevel(reviewCount, REVIEW_TIERS, 20)
}

// ── Bonus Badges (one-time special unlocks) ──────────────────────────────────

export interface BonusBadge {
    id: string
    title: string
    description: string
    emoji: string
    color: string        // border / accent color when unlocked
    glowColor: string    // glow when unlocked
    lockedHint: string   // what to do to unlock
}

export interface BonusBadgeStatus extends BonusBadge {
    unlocked: boolean
}

export const BONUS_BADGES: BonusBadge[] = [
    {
        id: "first_steps",
        title: "First Steps",
        description: "Watch your first film",
        emoji: "🎬",
        color: "#C0C0C0",
        glowColor: "rgba(192,192,192,0.45)",
        lockedHint: "Watch your first film to unlock",
    },
    {
        id: "genre_master",
        title: "Genre Master",
        description: "Watch 50 films in one genre",
        emoji: "🏅",
        color: "#F59E0B",
        glowColor: "rgba(245,158,11,0.45)",
        lockedHint: "Watch 50 films in a single genre",
    },
    {
        id: "weekend_warrior",
        title: "Weekend Warrior",
        description: "Watch 5 films in one weekend",
        emoji: "📅",
        color: "#3B82F6",
        glowColor: "rgba(59,130,246,0.45)",
        lockedHint: "Watch 5 films in a single weekend",
    },
    {
        id: "binge_master",
        title: "Binge Master",
        description: "Watch an entire franchise/series",
        emoji: "🎞️",
        color: "#8B5CF6",
        glowColor: "rgba(139,92,246,0.45)",
        lockedHint: "Complete an entire film franchise",
    },
    {
        id: "trendsetter",
        title: "Trendsetter",
        description: "Watch a film within its first week of release",
        emoji: "🚀",
        color: "#EF4444",
        glowColor: "rgba(239,68,68,0.45)",
        lockedHint: "Watch a film in its opening week",
    },
    {
        id: "critics_choice",
        title: "Critic's Choice",
        description: "Write a review with 500+ words",
        emoji: "✒️",
        color: "#FFD700",
        glowColor: "rgba(255,215,0,0.5)",
        lockedHint: "Write a detailed review (500+ words)",
    },
    {
        id: "community_fav",
        title: "Community Favorite",
        description: "Get 100 likes on a review",
        emoji: "❤️",
        color: "#EC4899",
        glowColor: "rgba(236,72,153,0.45)",
        lockedHint: "Get 100 likes on one of your reviews",
    },
]

export interface BonusBadgeEvalContext {
    watchedCount: number
    reviewCount: number
    watchlistCount: number
}

export function evaluateBonusBadges(ctx: BonusBadgeEvalContext): BonusBadgeStatus[] {
    const unlockMap: Record<string, (c: BonusBadgeEvalContext) => boolean> = {
        first_steps: (c) => c.watchedCount >= 1,
        genre_master: () => false,       // requires genre tracking
        weekend_warrior: () => false,    // requires date analysis
        binge_master: () => false,       // requires franchise data
        trendsetter: () => false,        // requires release-date comparison
        critics_choice: () => false,     // would need longest review word count
        community_fav: () => false,      // requires review likes data
    }

    return BONUS_BADGES.map((badge) => ({
        ...badge,
        unlocked: (unlockMap[badge.id]?.(ctx)) ?? false,
    }))
}
