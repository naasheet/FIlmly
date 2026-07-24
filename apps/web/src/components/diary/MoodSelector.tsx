import { MOOD_LIST, type MoodType } from "../../constants/moods"

type MoodBadgeProps = {
    mood: MoodType | string | null | undefined
    showLabel?: boolean
    size?: "sm" | "md"
}

/** Display-only mood badge (not selectable) */
export function MoodBadge({ mood, showLabel = true, size = "md" }: MoodBadgeProps) {
    const moodConfig = MOOD_LIST.find((m) => m.id === mood)

    if (!moodConfig) {
        if (!mood) return null
        const sizeClasses = {
            sm: "px-2 py-0.5 text-xs",
            md: "px-3 py-1 text-sm",
        }
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 font-medium text-white/70 ${sizeClasses[size]}`}
            >
                {showLabel && <span>{mood}</span>}
            </span>
        )
    }

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border font-medium ${moodConfig.bgColor} ${moodConfig.borderColor} ${moodConfig.color} ${sizeClasses[size]}`}
        >
            <span>{moodConfig.emoji}</span>
            {showLabel && <span>{moodConfig.label}</span>}
        </span>
    )
}
