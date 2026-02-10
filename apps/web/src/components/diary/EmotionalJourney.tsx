import { useEffect, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { getMood, type MoodType } from "../../constants/moods"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type EmotionalJourneyProps = {
    moodBefore?: MoodType | string | null
    moodAfter?: MoodType | string | null
    filmTitle?: string
    animate?: boolean
    size?: "sm" | "md" | "lg"
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function EmotionalJourney({
    moodBefore,
    moodAfter,
    filmTitle,
    animate = true,
    size = "md",
}: EmotionalJourneyProps) {
    const [isAnimating, setIsAnimating] = useState(false)
    const [showAfter, setShowAfter] = useState(!animate)

    const beforeMood = getMood(moodBefore)
    const afterMood = getMood(moodAfter)

    // Only show if at least one mood is present
    if (!beforeMood && !afterMood) {
        return null
    }

    // Trigger animation on mount
    useEffect(() => {
        if (animate && afterMood) {
            const timer = setTimeout(() => {
                setIsAnimating(true)
                setTimeout(() => setShowAfter(true), 600)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [animate, afterMood])

    // Size variants
    const sizeConfig = {
        sm: {
            container: "p-3 gap-3",
            emoji: "text-2xl",
            label: "text-xs",
            arrow: "h-4 w-4",
            glow: "blur-xl",
        },
        md: {
            container: "p-5 gap-4",
            emoji: "text-4xl",
            label: "text-sm",
            arrow: "h-5 w-5",
            glow: "blur-2xl",
        },
        lg: {
            container: "p-6 gap-6",
            emoji: "text-5xl",
            label: "text-base",
            arrow: "h-6 w-6",
            glow: "blur-3xl",
        },
    }

    const config = sizeConfig[size]

    // Single mood display (no journey)
    if (!beforeMood || !afterMood) {
        const mood = beforeMood || afterMood
        if (!mood) return null

        return (
            <div
                className={`relative overflow-hidden rounded-2xl border ${mood.borderColor} ${mood.bgColor} ${config.container}`}
            >
                {/* Glow */}
                <div
                    className={`absolute inset-0 ${config.glow} opacity-30`}
                    style={{ backgroundColor: mood.hex }}
                />

                <div className="relative flex items-center gap-3">
                    <span className={config.emoji}>{mood.emoji}</span>
                    <div>
                        <p className={`font-medium ${mood.color} ${config.label}`}>
                            Feeling {mood.label.toLowerCase()}
                        </p>
                        {filmTitle && (
                            <p className="mt-0.5 text-xs text-white/40">while watching {filmTitle}</p>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // Full journey with before → after
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.02] to-white/[0.04]">
            {/* Animated background gradient */}
            <div
                className="absolute inset-0 transition-opacity duration-1000"
                style={{
                    background: `linear-gradient(135deg, ${beforeMood.hex}20 0%, transparent 50%, ${afterMood.hex}20 100%)`,
                    opacity: showAfter ? 1 : 0.5,
                }}
            />

            {/* Background glow orbs */}
            <div
                className={`absolute -left-10 -top-10 h-32 w-32 rounded-full ${config.glow} transition-all duration-1000`}
                style={{
                    backgroundColor: beforeMood.hex,
                    opacity: showAfter ? 0.1 : 0.3,
                }}
            />
            <div
                className={`absolute -bottom-10 -right-10 h-32 w-32 rounded-full ${config.glow} transition-all duration-1000`}
                style={{
                    backgroundColor: afterMood.hex,
                    opacity: showAfter ? 0.3 : 0.1,
                }}
            />

            <div className={`relative flex items-center justify-between ${config.container}`}>
                {/* Before Mood */}
                <div
                    className={`flex flex-col items-center transition-all duration-500 ${showAfter ? "opacity-60 scale-95" : "opacity-100 scale-100"
                        }`}
                >
                    <div
                        className={`relative ${config.emoji} transition-transform duration-500 ${isAnimating ? "scale-90" : "scale-100"
                            }`}
                    >
                        {beforeMood.emoji}
                        {/* Subtle ring */}
                        <div
                            className="absolute inset-0 -z-10 scale-150 rounded-full opacity-20"
                            style={{ backgroundColor: beforeMood.hex }}
                        />
                    </div>
                    <p className={`mt-2 font-medium ${beforeMood.color} ${config.label}`}>
                        {beforeMood.label}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Before</p>
                </div>

                {/* Journey Arrow */}
                <div className="flex flex-col items-center gap-1 px-4">
                    {/* Animated particles */}
                    <div className="relative">
                        {animate && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                {[...Array(3)].map((_, i) => (
                                    <Sparkles
                                        key={i}
                                        className={`absolute h-3 w-3 text-amber-400 transition-all duration-1000 ${isAnimating
                                            ? "translate-x-4 opacity-0"
                                            : "translate-x-0 opacity-100"
                                            }`}
                                        style={{
                                            transitionDelay: `${i * 200}ms`,
                                            top: `${(i - 1) * 8}px`,
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div
                            className={`flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 transition-all duration-500 ${isAnimating ? "scale-110 border-amber-400/30" : ""
                                }`}
                        >
                            <ArrowRight
                                className={`${config.arrow} text-white/50 transition-all duration-500 ${isAnimating ? "text-amber-400 translate-x-1" : ""
                                    }`}
                            />
                        </div>
                    </div>

                    {filmTitle && (
                        <p className="max-w-[100px] text-center text-[10px] text-white/30 line-clamp-1">
                            {filmTitle}
                        </p>
                    )}
                </div>

                {/* After Mood */}
                <div
                    className={`flex flex-col items-center transition-all duration-500 ${showAfter ? "opacity-100 scale-100" : "opacity-40 scale-90"
                        }`}
                >
                    <div
                        className={`relative ${config.emoji} transition-transform duration-500 ${showAfter ? "scale-100" : "scale-75"
                            }`}
                    >
                        {afterMood.emoji}
                        {/* Pulsing ring when revealed */}
                        <div
                            className={`absolute inset-0 -z-10 scale-150 rounded-full transition-all duration-700 ${showAfter ? "animate-pulse opacity-30" : "opacity-0"
                                }`}
                            style={{ backgroundColor: afterMood.hex }}
                        />
                    </div>
                    <p className={`mt-2 font-medium ${afterMood.color} ${config.label}`}>
                        {afterMood.label}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">After</p>
                </div>
            </div>

            {/* Journey line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden">
                <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                        background: `linear-gradient(90deg, ${beforeMood.hex}, ${afterMood.hex})`,
                        width: showAfter ? "100%" : "0%",
                    }}
                />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact Badge Version
// ─────────────────────────────────────────────────────────────────────────────

type MoodJourneyBadgeProps = {
    moodBefore?: MoodType | string | null
    moodAfter?: MoodType | string | null
}

export function MoodJourneyBadge({ moodBefore, moodAfter }: MoodJourneyBadgeProps) {
    const before = getMood(moodBefore)
    const after = getMood(moodAfter)

    if (!before && !after) return null

    if (!before || !after) {
        const mood = before || after
        if (!mood) return null
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${mood.bgColor} ${mood.borderColor} ${mood.color}`}
            >
                {mood.emoji} {mood.label}
            </span>
        )
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs">
            <span style={{ color: before.hex }}>{before.emoji}</span>
            <ArrowRight className="h-3 w-3 text-white/30" />
            <span style={{ color: after.hex }}>{after.emoji}</span>
        </span>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// Mood Shift Indicator
// ─────────────────────────────────────────────────────────────────────────────

type MoodShiftProps = {
    moodBefore?: MoodType | string | null
    moodAfter?: MoodType | string | null
}

export function MoodShift({ moodBefore, moodAfter }: MoodShiftProps) {
    const before = getMood(moodBefore)
    const after = getMood(moodAfter)

    if (!before || !after) return null

    // Determine if the shift is positive, negative, or neutral
    const positiveModeds = ["joyful", "energized", "inspired", "thrilled", "peaceful"]
    const beforePositive = positiveModeds.includes(before.id)
    const afterPositive = positiveModeds.includes(after.id)

    let shiftLabel = "neutral"
    let shiftColor = "text-white/50"

    if (!beforePositive && afterPositive) {
        shiftLabel = "uplifting"
        shiftColor = "text-emerald-400"
    } else if (beforePositive && !afterPositive) {
        shiftLabel = "sobering"
        shiftColor = "text-blue-400"
    } else if (before.id !== after.id) {
        shiftLabel = "transformative"
        shiftColor = "text-violet-400"
    }

    return (
        <div className="flex items-center gap-2 text-xs">
            <div
                className="h-2 w-2 rounded-full"
                style={{
                    background: `linear-gradient(135deg, ${before.hex}, ${after.hex})`,
                }}
            />
            <span className={shiftColor}>{shiftLabel} journey</span>
        </div>
    )
}
