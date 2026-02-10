import { Link } from "react-router-dom"

interface CastCardProps {
    id: number
    name: string
    character?: string | null
    profilePath?: string | null
}

export default function CastCard({
    id,
    name,
    character,
    profilePath,
}: CastCardProps) {
    const imageUrl = profilePath
        ? `https://image.tmdb.org/t/p/w185${profilePath}`
        : null

    return (
        <Link
            to={`/person/${id}`}
            className="group flex w-24 shrink-0 flex-col items-center gap-3 text-center"
        >
            {/* Profile Image */}
            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white/10 bg-slate-800 transition-all duration-300 group-hover:border-amber-400/40 group-hover:ring-4 group-hover:ring-amber-400/10">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800 text-xl font-semibold text-slate-400">
                        {name[0]?.toUpperCase() || "?"}
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="space-y-0.5">
                <p className="text-xs font-medium text-white line-clamp-1 group-hover:text-amber-400 transition-colors duration-200">
                    {name}
                </p>
                {character && (
                    <p className="text-[10px] text-slate-500 line-clamp-1">{character}</p>
                )}
            </div>
        </Link>
    )
}
