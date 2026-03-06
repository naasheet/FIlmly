import type { AchievementProgress, AchievementTier } from "../../constants/achievements"
import { useCountUp } from "../../hooks/useCountUp"
import "./achievements.css"

type Props = {
    kind: "watched" | "reviews"
    progress: AchievementProgress
    tiers: AchievementTier[]
    step: number
    onOpenModal?: () => void
}

export default function AchievementCard({ kind, progress, tiers, step, onOpenModal }: Props) {
  const { tier, level, totalCount, percentage, isMaxLevel, currentProgress } = progress
  const animatedTotal = useCountUp(totalCount)

    const label = kind === "watched" ? "WATCHED" : "REVIEWS"
    const unit = kind === "watched" ? "films" : "reviews"

    const isLegendary = level >= 7
    const isMax = level >= tiers.length

    return (
    <button
        type="button"
        onClick={onOpenModal}
        className="achievement-card achievement-enter group w-full cursor-pointer rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-transform duration-200 hover:scale-[1.05]"
    >
            <div className="flex items-start gap-4">
                {/* Badge */}
                <div
                    className={`achievement-badge transition-transform duration-300 group-hover:scale-105 ${isLegendary ? "achievement-badge--legendary" : ""} ${isMax ? "achievement-badge--max" : ""}`}
                    style={{
                        "--badge-color": tier.color,
                        "--badge-glow": tier.glowColor,
                    } as React.CSSProperties}
                >
                    <span className="badge-emoji">{tier.emoji}</span>
                    <span className="badge-level">{level}</span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                    {/* Label + level */}
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                        {label}
                    </p>
                    <p className="mt-0.5 font-['Outfit'] text-lg font-bold text-white">
                        {tier.title}
                    </p>

                    {/* Divider */}
                    <div className="my-2.5 h-px bg-white/[0.08]" />

                    {/* Total */}
                    <p className="text-sm text-white/70">
                        <span className="font-semibold text-white">{animatedTotal}</span> {unit} {kind === "watched" ? "watched" : "written"}
                    </p>

                    {/* Progress bar */}
                    {!isMax && (
                        <div className="mt-3">
                            <div className="achievement-progress-track">
                                <div
                                    className="achievement-progress-fill"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs font-medium text-white/50">
                                {currentProgress}/{step} to next level
                            </p>
                        </div>
                    )}

                    {isMax && (
                        <div className="mt-3">
                            <div className="achievement-progress-track">
                                <div
                                    className="achievement-progress-fill"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs font-medium text-purple-300/80">
                                ✨ Max level reached!
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </button>
    )
}
