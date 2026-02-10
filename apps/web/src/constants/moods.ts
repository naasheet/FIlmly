// Mood types with colors and emojis for the diary feature

export type MoodType =
    | "contemplative"
    | "joyful"
    | "melancholic"
    | "energized"
    | "curious"
    | "peaceful"
    | "anxious"
    | "inspired"
    | "nostalgic"
    | "thrilled"

export interface MoodConfig {
    id: MoodType
    label: string
    emoji: string
    color: string        // Tailwind text color class
    bgColor: string      // Tailwind bg color class
    borderColor: string  // Tailwind border color class
    hex: string          // Raw hex for gradients/custom use
}

export const MOODS: Record<MoodType, MoodConfig> = {
    contemplative: {
        id: "contemplative",
        label: "Contemplative",
        emoji: "🤔",
        color: "text-indigo-400",
        bgColor: "bg-indigo-400/10",
        borderColor: "border-indigo-400/30",
        hex: "#818cf8",
    },
    joyful: {
        id: "joyful",
        label: "Joyful",
        emoji: "😊",
        color: "text-amber-400",
        bgColor: "bg-amber-400/10",
        borderColor: "border-amber-400/30",
        hex: "#fbbf24",
    },
    melancholic: {
        id: "melancholic",
        label: "Melancholic",
        emoji: "😢",
        color: "text-blue-400",
        bgColor: "bg-blue-400/10",
        borderColor: "border-blue-400/30",
        hex: "#60a5fa",
    },
    energized: {
        id: "energized",
        label: "Energized",
        emoji: "⚡",
        color: "text-orange-400",
        bgColor: "bg-orange-400/10",
        borderColor: "border-orange-400/30",
        hex: "#fb923c",
    },
    curious: {
        id: "curious",
        label: "Curious",
        emoji: "🧐",
        color: "text-cyan-400",
        bgColor: "bg-cyan-400/10",
        borderColor: "border-cyan-400/30",
        hex: "#22d3ee",
    },
    peaceful: {
        id: "peaceful",
        label: "Peaceful",
        emoji: "😌",
        color: "text-emerald-400",
        bgColor: "bg-emerald-400/10",
        borderColor: "border-emerald-400/30",
        hex: "#34d399",
    },
    anxious: {
        id: "anxious",
        label: "Anxious",
        emoji: "😰",
        color: "text-rose-400",
        bgColor: "bg-rose-400/10",
        borderColor: "border-rose-400/30",
        hex: "#fb7185",
    },
    inspired: {
        id: "inspired",
        label: "Inspired",
        emoji: "✨",
        color: "text-violet-400",
        bgColor: "bg-violet-400/10",
        borderColor: "border-violet-400/30",
        hex: "#a78bfa",
    },
    nostalgic: {
        id: "nostalgic",
        label: "Nostalgic",
        emoji: "🥹",
        color: "text-pink-400",
        bgColor: "bg-pink-400/10",
        borderColor: "border-pink-400/30",
        hex: "#f472b6",
    },
    thrilled: {
        id: "thrilled",
        label: "Thrilled",
        emoji: "🤩",
        color: "text-yellow-400",
        bgColor: "bg-yellow-400/10",
        borderColor: "border-yellow-400/30",
        hex: "#facc15",
    },
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Get all moods as an array */
export const MOOD_LIST: MoodConfig[] = Object.values(MOODS)

/** Get mood config by id, returns undefined if not found */
export function getMood(id: string | null | undefined): MoodConfig | undefined {
    if (!id) return undefined
    return MOODS[id as MoodType]
}

/** Get mood label with emoji */
export function getMoodLabel(id: string | null | undefined): string {
    const mood = getMood(id)
    return mood ? `${mood.emoji} ${mood.label}` : ""
}

/** Get mood emoji only */
export function getMoodEmoji(id: string | null | undefined): string {
    const mood = getMood(id)
    return mood?.emoji ?? ""
}

/** Check if a string is a valid mood type */
export function isValidMood(id: string | null | undefined): id is MoodType {
    if (!id) return false
    return id in MOODS
}

/** Get mood options for select/dropdown components */
export const MOOD_OPTIONS = MOOD_LIST.map((mood) => ({
    value: mood.id,
    label: `${mood.emoji} ${mood.label}`,
}))
