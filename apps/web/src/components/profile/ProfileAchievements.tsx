import { useMemo, useState } from "react"
import AchievementCard from "../home/AchievementCard"
import AchievementModal from "../home/AchievementModal"
import {
    WATCHED_TIERS,
    REVIEW_TIERS,
    calculateWatchedLevel,
    calculateReviewLevel,
    evaluateBonusBadges,
    type BonusBadgeStatus,
} from "../../constants/achievements"
import "../home/achievements.css"

type Props = {
    watchedCount: number
    reviewCount: number
    watchlistCount: number
}

export default function ProfileAchievements({ watchedCount, reviewCount, watchlistCount }: Props) {
    const [achievementModal, setAchievementModal] = useState<"watched" | "reviews" | null>(null)

    const watchedProgress = useMemo(() => calculateWatchedLevel(watchedCount), [watchedCount])
    const reviewProgress = useMemo(() => calculateReviewLevel(reviewCount), [reviewCount])
    const bonusBadges = useMemo(
        () => evaluateBonusBadges({ watchedCount, reviewCount, watchlistCount }),
        [watchedCount, reviewCount, watchlistCount],
    )

    const unlockedCount = bonusBadges.filter((b) => b.unlocked).length

    return (
        <div className="space-y-10">
            {/* ── Tiered Achievements ─────────────────────────────────────────── */}
            <div>
                <h3 className="mb-1 font-['Outfit'] text-lg font-bold text-white">
                    Progress Achievements
                </h3>
                <p className="mb-5 text-sm text-white/40">
                    Level up by watching films and writing reviews
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <AchievementCard
                        kind="watched"
                        progress={watchedProgress}
                        tiers={WATCHED_TIERS}
                        step={50}
                        onOpenModal={() => setAchievementModal("watched")}
                    />
                    <AchievementCard
                        kind="reviews"
                        progress={reviewProgress}
                        tiers={REVIEW_TIERS}
                        step={20}
                        onOpenModal={() => setAchievementModal("reviews")}
                    />
                </div>
            </div>

            {/* ── Bonus Badges ──────────────────────────────────────────── */}
            <div>
                <div className="mb-5 flex items-baseline justify-between">
                    <div>
                        <h3 className="font-['Outfit'] text-lg font-bold text-white">
                            Bonus Badges
                        </h3>
                        <p className="mt-1 text-sm text-white/40">
                            Special one-time achievements
                        </p>
                    </div>
                    <span className="text-xs font-semibold text-white/30">
                        {unlockedCount}/{bonusBadges.length} unlocked
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {bonusBadges.map((badge, i) => (
                        <BonusBadgeCard key={badge.id} badge={badge} index={i} />
                    ))}
                </div>
            </div>

            {/* ── Achievement Modal ─────────────────────────────── */}
            {achievementModal && (
                <AchievementModal
                    kind={achievementModal}
                    progress={achievementModal === "watched" ? watchedProgress : reviewProgress}
                    tiers={achievementModal === "watched" ? WATCHED_TIERS : REVIEW_TIERS}
                    onClose={() => setAchievementModal(null)}
                />
            )}
        </div>
    )
}

/* ─── Bonus Badge Card ─────────────────────────────────────────────────────── */

function BonusBadgeCard({ badge, index }: { badge: BonusBadgeStatus; index: number }) {
    const { unlocked, emoji, title, description, lockedHint, color, glowColor } = badge

    return (
        <div
            className={`bonus-badge-card achievement-enter group relative flex flex-col items-center rounded-2xl border p-5 text-center transition-transform duration-200 ${unlocked
                    ? "border-white/15 bg-white/[0.04] hover:scale-[1.04]"
                    : "border-white/[0.06] bg-white/[0.02]"
                }`}
            style={{ animationDelay: `${index * 0.06}s` }}
        >
            {/* Badge circle */}
            <div
                className={`bonus-badge-icon mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 ${unlocked
                        ? "group-hover:scale-110"
                        : "grayscale opacity-40"
                    }`}
                style={{
                    borderColor: unlocked ? color : "rgba(255,255,255,0.1)",
                    boxShadow: unlocked ? `0 0 20px ${glowColor}` : "none",
                    background: unlocked
                        ? `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 60%), rgba(18,18,24,0.95)`
                        : "rgba(18,18,24,0.8)",
                }}
            >
                <span className="text-2xl leading-none">{emoji}</span>
            </div>

            {/* Title */}
            <p
                className={`font-['Outfit'] text-sm font-bold ${unlocked ? "text-white" : "text-white/30"
                    }`}
            >
                {title}
            </p>

            {/* Description */}
            <p
                className={`mt-1 text-xs leading-relaxed ${unlocked ? "text-white/50" : "text-white/20"
                    }`}
            >
                {unlocked ? description : lockedHint}
            </p>

            {/* Unlocked indicator */}
            {unlocked && (
                <div
                    className="mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                    style={{ background: `${color}20`, color }}
                >
                    ✓ Unlocked
                </div>
            )}

            {/* Locked overlay icon */}
            {!unlocked && (
                <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-white/20">
                    🔒 Locked
                </div>
            )}
        </div>
    )
}
