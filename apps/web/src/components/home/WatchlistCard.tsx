import { Bookmark } from "lucide-react"
import { useCountUp } from "../../hooks/useCountUp"
import "./achievements.css"

type Props = {
    count: number
}

export default function WatchlistCard({ count }: Props) {
    const animatedCount = useCountUp(count)

    return (
        <div className="simple-stat-card achievement-enter group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-transform duration-200 hover:scale-[1.05]">
            <div className="flex items-center gap-4">
                {/* Muted icon */}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
                    <Bookmark className="h-5 w-5 text-white/30" />
                </div>

                {/* Info */}
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                        WATCHLIST
                    </p>
                    <p className="mt-0.5 text-sm text-white/60">
                        <span className="font-['Outfit'] text-lg font-bold text-white">{animatedCount}</span>{" "}
                        films saved
                    </p>
                </div>
            </div>
        </div>
    )
}
