import { useState } from "react"
import RatingStars from "../ui/RatingStars"

type ReviewFormValues = {
  rating: number
  comment: string
  containsSpoilers: boolean
  rewatch: boolean
  watchedDate?: string
}

type ReviewFormProps = {
  initialValues?: Partial<ReviewFormValues>
  onSubmit: (values: ReviewFormValues) => Promise<void> | void
  submitLabel?: string
}

export default function ReviewForm({
  initialValues,
  onSubmit,
  submitLabel = "Publish review",
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialValues?.rating ?? 0)
  const [comment, setComment] = useState(initialValues?.comment ?? "")
  const [containsSpoilers, setContainsSpoilers] = useState(
    initialValues?.containsSpoilers ?? false
  )
  const [rewatch, setRewatch] = useState(initialValues?.rewatch ?? false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!rating) {
      setError("Please select a rating.")
      return
    }

    if (!comment.trim()) {
      setError("Please add a short review before submitting.")
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        containsSpoilers,
        rewatch,
        watchedDate: undefined,
      })
    } catch (err: any) {
      setError(err?.message ?? "Unable to submit review.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6"
    >
      <div>
        <p className="text-sm font-semibold text-white">Your rating</p>
        <div className="mt-2 flex items-center gap-3">
          <RatingStars
            value={rating}
            onChange={(next) => setRating(next)}
            readOnly={submitting}
            step={0.5}
            size="sm"
            label="Review rating"
          />
          <span className="text-xs text-slate-400">{rating.toFixed(1)}/5</span>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-white" htmlFor="review-comment">
          Your review
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={5}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
          placeholder="Share what stood out to you, the tone, performances, or rewatch value."
        />
      </div>

      <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
          Contains spoilers
          <span className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(event) => setContainsSpoilers(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-indigo-500/70" />
            <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
          </span>
        </label>
        <label className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
          Rewatch
          <span className="relative inline-flex items-center">
            <input
              type="checkbox"
              checked={rewatch}
              onChange={(event) => setRewatch(event.target.checked)}
              className="peer sr-only"
            />
            <span className="h-5 w-10 rounded-full border border-white/10 bg-white/10 transition peer-checked:bg-indigo-500/70" />
            <span className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : submitLabel}
      </button>
    </form>
  )
}
