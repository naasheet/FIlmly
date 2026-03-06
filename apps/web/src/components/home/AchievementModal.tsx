import { X } from "lucide-react"
import type { AchievementProgress, AchievementTier } from "../../constants/achievements"
import "./achievements.css"

type Props = {
    kind: "watched" | "reviews"
    progress: AchievementProgress
    tiers: AchievementTier[]
    onClose: () => void
}

export default function AchievementModal({ kind, progress, tiers, onClose }: Props) {
    const label = kind === "watched" ? "Films Watched" : "Reviews Written"
    const unit = kind === "watched" ? "films" : "reviews"

    return (
        <div
            className="achievement-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="achievement-modal-content relative mx-4 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[rgb(18,18,24)] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                            Achievement Progress
                        </p>
                        <h2 className="mt-0.5 font-['Outfit'] text-xl font-bold text-white">{label}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-white/10"
                    >
                        <X className="h-4 w-4 text-white/60" />
                    </button>
                </div>

                {/* Current stat */}
                <div className="border-b border-white/[0.06] px-6 py-4 text-center">
                    <p className="font-['Outfit'] text-4xl font-bold text-white">{progress.totalCount}</p>
                    <p className="mt-1 text-sm text-white/50">{unit} total</p>
                </div>

                {/* Tier list */}
                <div className="max-h-[50vh] overflow-y-auto px-6 py-4">
                    <div className="space-y-2">
                        {tiers.map((t) => {
                            const isCurrent = t.level === progress.level
                            const isLocked = t.level > progress.level

                            return (
                                <div
                                    key={t.level}
                                    className={`tier-row flex items-center gap-3 rounded-xl border border-white/[0.06] p-3 ${isCurrent ? "tier-row--current" : ""
                                        } ${isLocked ? "tier-row--locked" : ""}`}
                                >
                                    {/* Mini badge */}
                                    <div
                                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2"
                                        style={{
                                            borderColor: isLocked ? "rgba(255,255,255,0.1)" : t.color,
                                            boxShadow: isLocked ? "none" : `0 0 10px ${t.glowColor}`,
                                            background: "rgba(18,18,24,0.9)",
                                        }}
                                    >
                                        <span className="text-lg">{t.emoji}</span>
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-white/40">LVL {t.level}</span>
                                            <span className="font-['Outfit'] text-sm font-semibold text-white">
                                                {t.title}
                                            </span>
                                            {isCurrent && (
                                                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                                                    CURRENT
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-white/40">{t.description}</p>
                                    </div>

                                    {/* Count requirement */}
                                    <span className="flex-shrink-0 text-xs font-medium text-white/30">
                                        {t.minCount}+ {unit}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
