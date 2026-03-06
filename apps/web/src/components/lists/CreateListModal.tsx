import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { GripVertical, X } from "lucide-react"
import { searchFilms } from "../../services/filmService"
import { resolvePosterUrl } from "../../utils/image"
import { addFilmToList, createList, uploadListCover } from "../../services/listApi"
import { useListStore } from "../../stores/listStore"

type CreateListModalProps = {
  onClose: () => void
}

type FormData = {
  title: string
  description: string
  coverImage?: File | null
  listType: "PERSONAL" | "COLLABORATIVE" | "TEMPLATE"
  privacy: "PUBLIC" | "UNLISTED" | "PRIVATE"
  isRanked: boolean
  category: string
  tags: string[]
  films: Array<{
    filmId: number
    title: string
    posterPath?: string | null
    releaseDate?: string | null
    notes?: string | null
  }>
}

export default function CreateListModal({ onClose }: CreateListModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    coverImage: null,
    listType: "PERSONAL",
    privacy: "PUBLIC",
    isRanked: false,
    category: "General",
    tags: [],
    films: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [filmQuery, setFilmQuery] = useState("")
  const [filmResults, setFilmResults] = useState<
    Array<{ id: number; title: string; releaseDate?: string | null; posterPath?: string | null }>
  >([])
  const [filmLoading, setFilmLoading] = useState(false)
  const [filmOpen, setFilmOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState<Record<number, boolean>>({})
  const dragIdRef = useRef<number | null>(null)
  const requestIdRef = useRef(0)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [coverZoom, setCoverZoom] = useState(1)
  const navigate = useNavigate()
  const addToMyLists = useListStore((state) => state.addToMyLists)

  const coverPreview = useMemo(() => {
    if (!formData.coverImage) return null
    return URL.createObjectURL(formData.coverImage)
  }, [formData.coverImage])
  const trimmedFilmQuery = useMemo(() => filmQuery.trim(), [filmQuery])

  const popularTags = [
    "classics",
    "noir",
    "animation",
    "thriller",
    "romance",
    "oscar",
    "foreign",
    "indie",
    "sci-fi",
    "horror",
    "comedy",
    "drama",
  ]

  const addTags = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (!incoming.length) return
    setFormData((prev) => {
      const next = [...prev.tags]
      incoming.forEach((tag) => {
        if (next.length >= 10) return
        if (!next.includes(tag)) next.push(tag)
      })
      return { ...prev, tags: next }
    })
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  useEffect(() => {
    if (!trimmedFilmQuery) {
      setFilmResults([])
      setFilmLoading(false)
      return
    }

    setFilmLoading(true)
    const currentRequestId = ++requestIdRef.current
    const handle = window.setTimeout(async () => {
      try {
        const data = await searchFilms({ query: trimmedFilmQuery, page: 1 })
        if (requestIdRef.current !== currentRequestId) return
        const results = (data?.results ?? []).map((item: any) => item.film ?? item)
        setFilmResults(results)
      } catch (err) {
        if (requestIdRef.current !== currentRequestId) return
        setFilmResults([])
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setFilmLoading(false)
        }
      }
    }, 300)

    return () => window.clearTimeout(handle)
  }, [trimmedFilmQuery])

  const handleNext = () => {
    if (currentStep === 1) {
      const trimmed = formData.title.trim()
      if (!trimmed) {
        setError("Title is required.")
        return
      }
      if (trimmed.length > 100) {
        setError("Title must be 100 characters or less.")
        return
      }
      setError(null)
      setFormData((prev) => ({ ...prev, title: trimmed }))
      setCurrentStep(2)
      return
    }
    if (currentStep === 2) {
      setError(null)
      setCurrentStep(3)
    }
  }

  const handleSubmit = async (mode: "publish" | "draft") => {
    try {
      setSaving(true)
      setError(null)
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        listType: formData.listType,
        privacy: mode === "draft" ? "PRIVATE" : formData.privacy,
        isRanked: formData.isRanked,
        tags: formData.tags,
      }
        const created = await createList(payload)
        if (formData.coverImage) {
          try {
            await uploadListCover(created.id, formData.coverImage)
          } catch {
            // Ignore cover upload failures for now.
          }
        }
        if (formData.films.length > 0) {
          for (let index = 0; index < formData.films.length; index += 1) {
            const film = formData.films[index]
          const rank = formData.isRanked ? index + 1 : undefined
          await addFilmToList(created.id, film.filmId, rank, film.notes ?? undefined)
        }
      }
      addToMyLists(created)
      if (mode === "draft") {
        setToast("Saved as draft")
      } else {
        setToast("List created!")
      }
      setTimeout(() => {
        onClose()
        navigate(`/lists/${created.slug}`)
      }, 600)
    } catch (err: any) {
      setError(err?.message ?? "Failed to create list.")
    } finally {
      setSaving(false)
    }
  }

  const handleAddFilm = (film: {
    id: number
    title: string
    releaseDate?: string | null
    posterPath?: string | null
  }) => {
    setFormData((prev) => {
      if (prev.films.some((item) => item.filmId === film.id)) {
        return prev
      }
      return {
        ...prev,
        films: [
          ...prev.films,
          {
            filmId: film.id,
            title: film.title,
            posterPath: film.posterPath ?? null,
            releaseDate: film.releaseDate ?? null,
            notes: null,
          },
        ],
      }
    })
    setFilmQuery("")
    setFilmResults([])
    setFilmOpen(false)
  }

  const handleRemoveFilm = (filmId: number) => {
    setFormData((prev) => ({
      ...prev,
      films: prev.films.filter((film) => film.filmId !== filmId),
    }))
  }

  const handleReorder = (fromId: number, toId: number) => {
    setFormData((prev) => {
      const films = [...prev.films]
      const fromIndex = films.findIndex((film) => film.filmId === fromId)
      const toIndex = films.findIndex((film) => film.filmId === toId)
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return prev
      const [moved] = films.splice(fromIndex, 1)
      films.splice(toIndex, 0, moved)
      return { ...prev, films }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-h-[85vh] max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create List</p>
          <h2 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
            {currentStep === 1 && "Step 1: Basic Info"}
            {currentStep === 2 && "Step 2: Settings"}
            {currentStep === 3 && "Step 3: Add Films"}
            {currentStep === 4 && "Step 4: Review"}
          </h2>
        </div>

        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-white">Title</label>
              <input
                type="text"
                value={formData.title}
                maxLength={100}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, title: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60"
                placeholder="My favorite thrillers"
              />
                <div className="mt-2 flex items-center justify-end text-xs text-white/50">
                  <span>{formData.title.length}/100</span>
                </div>
              </div>

            <div>
              <label className="text-sm font-medium text-white">Description</label>
              <textarea
                value={formData.description}
                maxLength={1000}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60"
                placeholder="Add a short description (optional)"
              />
              <div className="mt-2 text-xs text-white/50">
                {formData.description.length}/1000
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white">Cover Image</label>
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <label className="cursor-pointer rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20">
                  Upload cover
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        coverImage: event.target.files?.[0] ?? null,
                      }))
                    }
                  />
                </label>
                <span className="text-xs text-white/50">Optional</span>
              </div>
            {coverPreview && (
              <div className="mt-4 space-y-3">
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                  <div className="relative h-40 w-full">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="absolute inset-0 h-full w-full object-cover"
                      style={{ transform: `scale(${coverZoom})`, transformOrigin: "center" }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                  <label className="flex items-center gap-2">
                    Zoom
                    <input
                      type="range"
                      min={0.8}
                      max={2}
                      step={0.05}
                      value={coverZoom}
                      onChange={(event) => setCoverZoom(Number(event.target.value))}
                      className="accent-amber-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setCoverZoom(1)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/10"
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, coverImage: null }))
                      setCoverZoom(1)
                    }}
                    className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20"
                  >
                    Remove image
                  </button>
                </div>
              </div>
            )}
          </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-white">List type</p>
              <div className="mt-2 grid gap-2">
                {[
                    { value: "PERSONAL", label: "Personal", desc: "Only you manage this list." },
                    { value: "COLLABORATIVE", label: "Collaborative", desc: "Invite others to edit." },
                  ].map((type) => (
                  <label
                    key={type.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                      formData.listType === type.value
                        ? "border-amber-400/60 bg-amber-400/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="listType"
                      className="mt-1"
                      checked={formData.listType === type.value}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, listType: type.value as FormData["listType"] }))
                      }
                    />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-white/50">{type.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Privacy</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[
                  { value: "PUBLIC", label: "Public", desc: "Visible to everyone." },
                  { value: "UNLISTED", label: "Unlisted", desc: "Only with link." },
                  { value: "PRIVATE", label: "Private", desc: "Only contributors." },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 text-sm transition ${
                      formData.privacy === option.value
                        ? "border-amber-400/60 bg-amber-400/10 text-amber-100"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="privacy"
                      className="hidden"
                      checked={formData.privacy === option.value}
                      onChange={() =>
                        setFormData((prev) => ({ ...prev, privacy: option.value as FormData["privacy"] }))
                      }
                    />
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-white/50">{option.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={formData.isRanked}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, isRanked: event.target.checked }))
                }
                className="mt-1"
              />
              <div>
                <p className="font-medium text-white">This is a ranked list</p>
                <p className="text-xs text-white/50">Films will have an explicit order.</p>
              </div>
            </label>

            <div>
              <label className="text-sm font-medium text-white">Category</label>
                <select
                  value={formData.category}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-400/60 hover:border-white/20"
                >
                  {[
                    "General",
                    "Decade",
                    "Genre",
                    "Director",
                    "Actor",
                    "Awards",
                    "Personal",
                    "Challenge",
                  ].map((option) => (
                    <option key={option} value={option} className="bg-[rgb(12,12,18)] text-slate-200">
                      {option}
                    </option>
                  ))}
                </select>
            </div>

            <div>
              <label className="text-sm font-medium text-white">Tags</label>
              <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                {formData.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-xs text-white/80 transition hover:border-rose-400/40 hover:text-rose-200"
                  >
                    {tag}
                  </button>
                ))}
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault()
                      addTags(tagInput)
                      setTagInput("")
                    }
                  }}
                  placeholder={formData.tags.length >= 10 ? "Max 10 tags" : "Add tags..."}
                  disabled={formData.tags.length >= 10}
                  className="min-w-[140px] flex-1 bg-transparent text-sm text-white outline-none"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/50">
                {popularTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTags(tag)}
                    className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 transition hover:border-amber-400/40 hover:text-amber-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-white">Search films to add</label>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={filmQuery}
                  onChange={(event) => {
                    setFilmQuery(event.target.value)
                    setFilmOpen(true)
                  }}
                  onFocus={() => setFilmOpen(true)}
                  placeholder="Search films to add..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60"
                />
                {filmOpen && (filmLoading || filmResults.length > 0) && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-auto rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/95 p-2 shadow-2xl">
                    {filmResults.map((film) => {
                      const year = film.releaseDate
                        ? new Date(film.releaseDate).getFullYear()
                        : null
                      return (
                        <button
                          key={film.id}
                          type="button"
                          onMouseDown={() => handleAddFilm(film)}
                          className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left text-sm text-white/80 transition hover:border-white/10 hover:bg-white/10"
                        >
                          <div className="flex h-10 w-8 items-center justify-center overflow-hidden rounded-lg bg-white/5 text-xs text-white/40">
                            {film.posterPath ? (
                              <img
                                src={resolvePosterUrl(film.posterPath, "w92") ?? ""}
                                alt={film.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              "?"
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white">{film.title}</p>
                            <p className="text-xs text-white/50">
                              {year ? year : "Release year unknown"}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                    {filmLoading && (
                      <div className="px-3 py-2 text-xs text-white/50">Searching...</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Added films</p>
                {formData.isRanked && (
                  <span className="text-xs text-white/50">Drag to reorder</span>
                )}
              </div>

              {formData.films.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/50">
                  No films added yet.
                </div>
              )}

              <div className="space-y-2">
                {formData.films.map((film, index) => (
                  <div
                    key={film.filmId}
                    draggable={formData.isRanked}
                    onDragStart={() => {
                      if (!formData.isRanked) return
                      dragIdRef.current = film.filmId
                    }}
                    onDragOver={(event) => {
                      if (!formData.isRanked) return
                      event.preventDefault()
                    }}
                    onDrop={(event) => {
                      if (!formData.isRanked) return
                      event.preventDefault()
                      const draggedId = dragIdRef.current
                      if (draggedId && draggedId !== film.filmId) {
                        handleReorder(draggedId, film.filmId)
                      }
                      dragIdRef.current = null
                    }}
                    className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {formData.isRanked && (
                        <div className="flex items-center gap-2 text-white/60">
                          <GripVertical className="h-4 w-4" />
                          <span className="text-xs">{index + 1}</span>
                        </div>
                      )}
                      <div className="flex h-12 w-9 items-center justify-center overflow-hidden rounded-lg bg-white/10 text-xs text-white/40">
                        {film.posterPath ? (
                          <img
                            src={resolvePosterUrl(film.posterPath, "w92") ?? ""}
                            alt={film.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          "?"
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{film.title}</p>
                        {film.releaseDate && (
                          <p className="text-xs text-white/50">
                            {new Date(film.releaseDate).getFullYear()}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFilm(film.filmId)}
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:border-rose-400/40 hover:text-rose-200"
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setNotesOpen((prev) => ({
                            ...prev,
                            [film.filmId]: !prev[film.filmId],
                          }))
                        }
                        className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/60 transition hover:border-amber-400/40 hover:text-amber-200"
                      >
                        {notesOpen[film.filmId] ? "Hide notes" : "Add notes"}
                      </button>
                    </div>

                    {notesOpen[film.filmId] && (
                      <textarea
                        value={film.notes ?? ""}
                        onChange={(event) => {
                          const value = event.target.value
                          setFormData((prev) => ({
                            ...prev,
                            films: prev.films.map((item) =>
                              item.filmId === film.filmId ? { ...item, notes: value } : item
                            ),
                          }))
                        }}
                        placeholder="Add personal notes..."
                        className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none focus:border-amber-400/60"
                        rows={3}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Back
              </button>
              {formData.films.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30"
                >
                  Review &amp; Publish
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  Skip for now
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-['Outfit'] text-xl font-semibold text-white">{formData.title}</h3>
              {formData.description && (
                <p className="mt-2 text-sm text-white/70">{formData.description}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {formData.listType}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {formData.privacy}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {formData.isRanked ? "Ranked" : "Unranked"}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                  {formData.films.length} films
                </span>
              </div>
              {formData.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-white">Preview</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(formData.films.length > 0 ? formData.films : []).slice(0, 4).map((film) => (
                  <div
                    key={film.filmId}
                    className="aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-white/5"
                  >
                    {film.posterPath ? (
                      <img
                        src={resolvePosterUrl(film.posterPath, "w342") ?? ""}
                        alt={film.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                        No poster
                      </div>
                    )}
                  </div>
                ))}
                {formData.films.length === 0 && (
                  <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-6 text-xs text-white/50 sm:col-span-4">
                    No films added yet.
                  </div>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-rose-300">{error}</p>}
            {toast && (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                {toast}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
              >
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit("draft")}
                  disabled={saving}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit("publish")}
                  disabled={saving}
                  className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
