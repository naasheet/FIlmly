import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Heart, Lock, Link2, Users } from "lucide-react"
import { resolvePosterUrl } from "../../utils/image"
import type { List } from "../../stores/listStore"

type ListCardProps = {
  list: List
  selectable?: boolean
  selected?: boolean
  onSelectToggle?: (listId: string) => void
}

function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function ListCard({
  list,
  selectable = false,
  selected = false,
  onSelectToggle,
}: ListCardProps) {
  const coverUrl = list.coverImagePath
    ? resolvePosterUrl(list.coverImagePath, "w780")
    : null

  const posters = useMemo(() => {
    const films = Array.isArray(list.films) ? list.films : []
    return films
      .map((item) => item.film?.posterPath ?? null)
      .filter(Boolean)
      .slice(0, 4) as string[]
  }, [list.films])

  const creatorName = list.user?.name || list.user?.username || "Unknown"
  const avatarUrl = list.user?.avatarUrl ?? null

  return (
    <Link
      to={`/lists/${list.slug}`}
      className="group block w-full overflow-hidden rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/80 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="relative">
        {selectable && (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onSelectToggle?.(list.id)
            }}
            className={`absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition ${
              selected
                ? "border-amber-400/80 bg-amber-400/20 text-amber-200"
                : "border-white/20 bg-black/50 text-white/70 hover:border-white/40"
            }`}
            aria-pressed={selected}
            aria-label={selected ? "Deselect list" : "Select list"}
          >
            {selected ? '✓' : ''}
          </button>
        )}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={list.title}
            className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-44 w-full grid-cols-2 grid-rows-2 gap-0.5 bg-black/60">
            {posters.length > 0 ? (
              posters.map((poster, index) => (
                <img
                  key={`${poster}-${index}`}
                  src={resolvePosterUrl(poster, "w342") ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ))
            ) : (
              <div className="col-span-2 row-span-2 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-white/30">
                No cover
              </div>
            )}
            {posters.length > 0 && posters.length < 4 && (
              [...Array(4 - posters.length)].map((_, idx) => (
                <div key={idx} className="bg-white/5" />
              ))
            )}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[rgb(8,8,12)] via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {list.privacy === "PRIVATE" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200">
              <Lock className="h-3 w-3" />
              Private
            </span>
          )}
          {list.privacy === "UNLISTED" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs text-white/80">
              <Link2 className="h-3 w-3" />
              Unlisted
            </span>
          )}
          {list.listType === "COLLABORATIVE" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
              <Users className="h-3 w-3" />
              Collaborative
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4 pt-3">
        <div>
          <h3 className="line-clamp-2 font-['Outfit'] text-lg font-semibold text-white transition-colors duration-300 group-hover:text-amber-200">
            {list.title}
          </h3>
          {list.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {list.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70 transition group-hover:border-white/20 group-hover:text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/10 text-xs font-semibold text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt={creatorName} className="h-full w-full object-cover" />
              ) : (
                getInitials(creatorName)
              )}
            </div>
            <span className="truncate">{creatorName}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs text-white/60">
          <span>{list.filmCount} films</span>
          <span className="inline-flex items-center gap-1 text-rose-200 transition group-hover:text-rose-100">
            <Heart className="h-3.5 w-3.5 fill-rose-400 text-rose-300" />
            {list.likeCount}
          </span>
        </div>
      </div>
    </Link>
  )
}


