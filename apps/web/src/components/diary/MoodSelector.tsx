import { MOOD_LIST, type MoodType, type MoodConfig } from "../../constants/moods"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type MoodSelectorProps = {
    value: MoodType | null
    onChange: (mood: MoodType | null) => void
    label?: string
    showLabel?: boolean
    size?: "sm" | "md" | "lg"
    disabled?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function MoodSelector({
    value,
    onChange,
    label = "How did it make you feel?",
    showLabel = true,
    size = "md",
    disabled = false,
}: MoodSelectorProps) {
    const handleSelect = (mood: MoodConfig) => {
        if (disabled) return
        onChange(value === mood.id ? null : mood.id)
    }

    // Size variants
    const sizeClasses = {
        sm: "px-2.5 py-1 text-xs gap-1",
        md: "px-4 py-2 text-sm gap-1.5",
        lg: "px-5 py-2.5 text-base gap-2",
    }

    const emojiSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
    }

    return (
        <div>
            {showLabel && (
                <label className="mb-3 block text-sm font-medium text-white/70">
                    {label}
                </label>
            )}

            <div className="flex flex-wrap gap-2">
                {MOOD_LIST.map((mood) => {
                    const isSelected = value === mood.id

                    return (
                        <button
                            key={mood.id}
                            type="button"
                            onClick={() => handleSelect(mood)}
                            disabled={disabled}
                            className={`
                group relative flex items-center rounded-full border font-medium transition-all
                ${sizeClasses[size]}
                ${isSelected
                                    ? `${mood.bgColor} ${mood.borderColor} ${mood.color}`
                                    : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10"
                                }
                ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              `}
                            aria-pressed={isSelected}
                            aria-label={`Select mood: ${mood.label}`}
                        >
                            {/* Color indicator dot (visible when not selected) */}
                            {!isSelected && (
                                <span
                                    className="h-2 w-2 rounded-full opacity-60 transition group-hover:opacity-100"
                                    style={{ backgroundColor: mood.hex }}
                                />
                            )}

                            {/* Emoji */}
                            <span className={emojiSizes[size]}>{mood.emoji}</span>

                            {/* Label */}
                            <span>{mood.label}</span>

                            {/* Selected indicator glow */}
                            {isSelected && (
                                <span
                                    className="absolute inset-0 -z-10 rounded-full opacity-20 blur-md"
                                    style={{ backgroundColor: mood.hex }}
                                />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Selected mood summary */}
            {value && (
                <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-white/50">Selected:</span>
                    {(() => {
                        const selected = MOOD_LIST.find((m) => m.id === value)
                        if (!selected) return null
                        return (
                            <span className={`text-sm font-medium ${selected.color}`}>
                                {selected.emoji} {selected.label}
                            </span>
                        )
                    })()}
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Variant
// ─────────────────────────────────────────────────────────────────────────────

type MoodBadgeProps = {
    mood: MoodType | string | null | undefined
    showLabel?: boolean
    size?: "sm" | "md"
}

/** Display-only mood badge (not selectable) */
export function MoodBadge({ mood, showLabel = true, size = "md" }: MoodBadgeProps) {
    const moodConfig = MOOD_LIST.find((m) => m.id === mood)

    if (!moodConfig) return null

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

// ─────────────────────────────────────────────────────────────────────────────
// Grid Variant (for larger displays)
// ─────────────────────────────────────────────────────────────────────────────

type MoodGridProps = {
    value: MoodType | null
    onChange: (mood: MoodType | null) => void
    columns?: 2 | 3 | 4 | 5
    disabled?: boolean
}

/** Grid layout mood selector for larger displays */
export function MoodGrid({
    value,
    onChange,
    columns = 5,
    disabled = false,
}: MoodGridProps) {
    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
    }

    return (
        <div className={`grid gap-2 ${gridCols[columns]}`}>
            {MOOD_LIST.map((mood) => {
                const isSelected = value === mood.id

                return (
                    <button
                        key={mood.id}
                        type="button"
                        onClick={() => onChange(isSelected ? null : mood.id)}
                        disabled={disabled}
                        className={`
              flex flex-col items-center gap-1 rounded-xl border p-3 transition-all
              ${isSelected
                                ? `${mood.bgColor} ${mood.borderColor}`
                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                            }
              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
            `}
                    >
                        <span className="text-2xl">{mood.emoji}</span>
                        <span
                            className={`text-xs font-medium ${isSelected ? mood.color : "text-white/70"}`}
                        >
                            {mood.label}
                        </span>
                        {/* Color bar indicator */}
                        <span
                            className={`mt-1 h-0.5 w-8 rounded-full transition-all ${isSelected ? "opacity-100" : "opacity-30"
                                }`}
                            style={{ backgroundColor: mood.hex }}
                        />
                    </button>
                )
            })}
        </div>
    )
}
