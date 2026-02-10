import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Link } from "react-router-dom"
import type { ListFilm } from "../../stores/listStore"

type StatsPanelProps = {
  films: ListFilm[]
  stats?: {
    topDirector?: { id: number; name: string; count: number } | null
    topActor?: { id: number; name: string; count: number } | null
  }
  selectedGenre?: string | null
  onSelectGenre?: (genre: string | null) => void
}

const PIE_COLORS = ["#fbbf24", "#f97316", "#fb7185", "#60a5fa", "#34d399", "#a78bfa"]

function formatRuntime(minutes: number) {
  if (!minutes || minutes <= 0) return "â€”"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours <= 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function getDecadeLabel(year: number) {
  const decade = Math.floor(year / 10) * 10
  return `${decade}s`
}

export default function ListStatisticsPanel({
  films,
  stats,
  selectedGenre,
  onSelectGenre,
}: StatsPanelProps) {
  const filmItems = (films ?? []).map((item) => item.film).filter(Boolean)

  const totalRuntime = filmItems.reduce((sum, film) => sum + (film?.runtime ?? 0), 0)
  const ratings = filmItems.map((film) => film?.tmdbRating).filter((value) => typeof value === "number") as number[]
  const avgRating =
    ratings.length > 0 ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1) : "â€”"

  const genreCounts = new Map<string, number>()
  filmItems.forEach((film) => {
    film?.genres?.forEach((genre) => {
      if (!genre) return
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1)
    })
  })

  const genreData = Array.from(genreCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const decadeCounts = new Map<string, number>()
  filmItems.forEach((film) => {
    if (!film?.releaseDate) return
    const year = Number(String(film.releaseDate).slice(0, 4))
    if (!Number.isFinite(year)) return
    const decade = getDecadeLabel(year)
    decadeCounts.set(decade, (decadeCounts.get(decade) ?? 0) + 1)
  })

  const decadeData = Array.from(decadeCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (a.label > b.label ? 1 : -1))

  const directorCounts = new Map<string, number>()
  filmItems.forEach((film) => {
    if (!film?.director) return
    directorCounts.set(film.director, (directorCounts.get(film.director) ?? 0) + 1)
  })

  const actorCounts = new Map<string, number>()
  filmItems.forEach((film) => {
    film?.cast?.forEach((actor) => {
      if (!actor) return
      actorCounts.set(actor, (actorCounts.get(actor) ?? 0) + 1)
    })
  })

  const topDirector = stats?.topDirector
    ? [stats.topDirector.name, stats.topDirector.count]
    : Array.from(directorCounts.entries()).sort((a, b) => b[1] - a[1])[0]
  const topActorFromStats = stats?.topActor ?? null
  const topActorFallback = Array.from(actorCounts.entries()).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
      <div>
        <h3 className="text-base font-semibold text-white">Statistics</h3>
        <p className="text-xs text-white/40">Snapshot of this list</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20">
          <p className="text-xs uppercase text-white/40">Total Runtime</p>
          <p className="mt-1 text-lg font-semibold text-white">{formatRuntime(totalRuntime)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20">
          <p className="text-xs uppercase text-white/40">Average Rating</p>
          <p className="mt-1 text-lg font-semibold text-white">{avgRating}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20">
          <p className="text-xs uppercase text-white/40">Most Common Director</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {topDirector ? (
              stats?.topDirector ? (
                <Link
                  to={`/person/${stats.topDirector.id}`}
                  className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
                >
                  {topDirector[0]} ({topDirector[1]})
                </Link>
              ) : (
                `${topDirector[0]} (${topDirector[1]})`
              )
            ) : (
              "â€”"
            )}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 transition hover:border-white/20">
          <p className="text-xs uppercase text-white/40">Most Common Actor</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {topActorFromStats ? (
              <Link
                to={`/person/${topActorFromStats.id}`}
                className="text-amber-200 hover:text-amber-100 underline-offset-2 hover:underline"
              >
                {topActorFromStats.name} ({topActorFromStats.count})
              </Link>
            ) : topActorFallback ? (
              `${topActorFallback[0]} (${topActorFallback[1]})`
            ) : (
              "â€”"
            )}
          </p>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">Genre Breakdown</h4>
        {genreData.length === 0 ? (
          <p className="mt-2 text-xs text-white/40">No genre data yet.</p>
        ) : (
          <div className="mt-3 min-w-0" style={{ width: "100%", height: 192 }}>
            <ResponsiveContainer width="100%" height={192} minWidth={0}>
              <PieChart>
                <Pie
                  data={genreData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  onClick={(data) => onSelectGenre?.(data?.name ?? null)}
                >
                  {genreData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke={selectedGenre === entry.name ? "#fde68a" : "rgba(255,255,255,0.12)"}
                      strokeWidth={selectedGenre === entry.name ? 2 : 1}
                      className="cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "rgba(255,255,255,0.95)",
                    border: "1px solid rgba(15,15,20,0.12)",
                    borderRadius: "8px",
                    color: "#111827",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
                  }}
                  itemStyle={{ color: "#111827" }}
                  labelStyle={{ color: "#111827", fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
        {genreData.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-[11px] text-white/50">
            <span>Click a genre to see films</span>
            {selectedGenre && (
              <button
                type="button"
                onClick={() => onSelectGenre?.(null)}
                className="text-amber-200 hover:text-amber-100"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">Decade Breakdown</h4>
        {decadeData.length === 0 ? (
          <p className="mt-2 text-xs text-white/40">No release dates yet.</p>
        ) : (
          <div className="mt-3 min-w-0" style={{ width: "100%", height: 176 }}>
            <ResponsiveContainer width="100%" height={176} minWidth={0}>
              <BarChart data={decadeData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.5)" fontSize={10} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(15, 15, 20, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

