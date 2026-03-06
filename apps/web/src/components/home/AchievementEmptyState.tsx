import { Link } from "react-router-dom"
import { Film, Pencil, Bookmark, ArrowRight } from "lucide-react"
import "./achievements.css"

export default function AchievementEmptyState() {
    return (
        <div className="achievement-enter flex flex-col items-center px-4 py-6 text-center">
            {/* Icon cluster */}
            <div className="relative mb-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
                    <Film className="h-7 w-7 text-purple-400" />
                </div>
                <div className="absolute -bottom-1 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[rgb(18,18,24)]">
                    <span className="text-sm">🎬</span>
                </div>
            </div>

            <h4 className="font-['Outfit'] text-base font-bold text-white">
                Start Your Cinema Journey
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-white/40">
                Track your progress as you:
            </p>

            {/* Milestones */}
            <ul className="mt-3 space-y-2 text-left text-sm text-white/50">
                <li className="flex items-center gap-3">
                    <Film className="h-3.5 w-3.5 flex-shrink-0 text-purple-400/60" />
                    <span>Watch films <span className="text-white/30">(level up every 50)</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-purple-400/60" />
                    <span>Write reviews <span className="text-white/30">(level up every 20)</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <Bookmark className="h-3.5 w-3.5 flex-shrink-0 text-purple-400/60" />
                    <span>Build your watchlist</span>
                </li>
            </ul>

        </div>
    )
}
