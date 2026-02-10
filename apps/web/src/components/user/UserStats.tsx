type UserStatsProps = {
  filmsWatched: number
  reviewsWritten: number
  onFilmsClick?: () => void
  onReviewsClick?: () => void
}

export default function UserStats({
  filmsWatched,
  reviewsWritten,
  onFilmsClick,
  onReviewsClick,
}: UserStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <button
        type="button"
        onClick={onFilmsClick}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-white/30 hover:bg-white/10"
      >
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Films watched
        </p>
        <p className="mt-3 text-2xl font-semibold text-white">{filmsWatched}</p>
      </button>
      <button
        type="button"
        onClick={onReviewsClick}
        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-white/30 hover:bg-white/10"
      >
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
          Reviews written
        </p>
        <p className="mt-3 text-2xl font-semibold text-white">{reviewsWritten}</p>
      </button>
    </div>
  )
}
