import { useEffect, useMemo, useRef, useState } from "react"
import { X } from "lucide-react"
import type { List } from "../../stores/listStore"
import { updateList, uploadListCover } from "../../services/listApi"
import { resolvePosterUrl } from "../../utils/image"

type EditListModalProps = {
  list: List
  onClose: () => void
  onUpdated: (updated: List) => void
}

export default function EditListModal({ list, onClose, onUpdated }: EditListModalProps) {
  const [title, setTitle] = useState(list.title ?? "")
  const [description, setDescription] = useState(list.description ?? "")
  const [listType, setListType] = useState<List["listType"]>(list.listType)
  const [privacy, setPrivacy] = useState<List["privacy"]>(list.privacy)
  const [isRanked, setIsRanked] = useState(Boolean(list.isRanked))
  const [tags, setTags] = useState<string[]>(list.tags ?? [])
  const [tagInput, setTagInput] = useState("")
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement | null>(null)

  const trimmedTitle = useMemo(() => title.trim(), [title])
  const existingCoverPreview = useMemo(
    () => (removeCover ? null : resolvePosterUrl(list.coverImagePath ?? null, "w1280")),
    [list.coverImagePath, removeCover]
  )
  const selectedCoverPreview = useMemo(
    () => (coverFile ? URL.createObjectURL(coverFile) : null),
    [coverFile]
  )
  const coverPreview = selectedCoverPreview ?? existingCoverPreview

  useEffect(() => {
    return () => {
      if (selectedCoverPreview) {
        URL.revokeObjectURL(selectedCoverPreview)
      }
    }
  }, [selectedCoverPreview])

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof Error ? err.message : fallback

  const addTags = (raw: string) => {
    const incoming = raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
    if (!incoming.length) return
    setTags((prev) => {
      const next = [...prev]
      incoming.forEach((tag) => {
        if (next.length >= 10) return
        if (!next.includes(tag)) next.push(tag)
      })
      return next
    })
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag))
  }

  const handleSave = async () => {
    const nextTitle = trimmedTitle
    if (!nextTitle) {
      setError("Title is required.")
      return
    }
    if (nextTitle.length > 100) {
      setError("Title must be 100 characters or less.")
      return
    }

    let baseUpdated: List | null = null
    try {
      setSaving(true)
      setError(null)
      const updated = await updateList(list.id, {
        title: nextTitle,
        description: description.trim() || null,
        listType,
        privacy,
        isRanked,
        tags,
        ...(removeCover && !coverFile ? { coverImagePath: null } : {}),
      })
      baseUpdated = { ...list, ...updated }
      if (coverFile) {
        const coverUpdated = await uploadListCover(list.id, coverFile)
        onUpdated({
          ...baseUpdated,
          coverImagePath: coverUpdated.coverImagePath,
        })
      } else {
        onUpdated(baseUpdated)
      }
      onClose()
    } catch (err: unknown) {
      if (baseUpdated) {
        onUpdated(baseUpdated)
      }
      setError(getErrorMessage(err, "Failed to update list."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[rgb(18,18,24)] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Edit List</p>
          <h2 className="mt-2 font-['Outfit'] text-2xl font-semibold text-white">
            Update details
          </h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-white">Title</label>
            <input
              type="text"
              value={title}
              maxLength={100}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60"
            />
            <div className="mt-2 text-xs text-white/50">{title.length}/100</div>
          </div>

          <div>
            <label className="text-sm font-medium text-white">Description</label>
            <textarea
              value={description}
              maxLength={1000}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-amber-400/60"
            />
            <div className="mt-2 text-xs text-white/50">{description.length}/1000</div>
          </div>

          <div>
            <label className="text-sm font-medium text-white">Cover image</label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:border-sky-400/70 hover:bg-sky-400/20"
              >
                {coverPreview ? "Replace cover" : "Upload cover"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCoverFile(null)
                  setRemoveCover(true)
                }}
                disabled={!coverPreview}
                className={`rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20 ${
                  !coverPreview ? "cursor-not-allowed opacity-60" : ""
                }`}
              >
                Remove cover
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null
                  event.currentTarget.value = ""
                  if (!file) return
                  setCoverFile(file)
                  setRemoveCover(false)
                }}
              />
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <div className="relative h-32 w-full">
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="List cover preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                    No cover image
                  </div>
                )}
              </div>
            </div>
            {coverFile && (
              <p className="mt-2 text-xs text-sky-200">New cover selected. Save changes to apply.</p>
            )}
            {removeCover && !coverFile && (
              <p className="mt-2 text-xs text-rose-200">Cover will be removed when you save.</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-white">List type</p>
            <div className="mt-2 grid gap-2">
              {[
                { value: "PERSONAL", label: "Personal", desc: "Only you manage this list." },
                { value: "COLLABORATIVE", label: "Collaborative", desc: "Invite others to edit." },
                { value: "TEMPLATE", label: "Template", desc: "Shared template list." },
              ].map((type) => (
                <label
                  key={type.value}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    listType === type.value
                      ? "border-amber-400/60 bg-amber-400/10 text-amber-100"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="listType"
                    className="mt-1"
                    checked={listType === type.value}
                    onChange={() => setListType(type.value as List["listType"])}
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
                    privacy === option.value
                      ? "border-amber-400/60 bg-amber-400/10 text-amber-100"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20"
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    className="hidden"
                    checked={privacy === option.value}
                    onChange={() => setPrivacy(option.value as List["privacy"])}
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
              checked={isRanked}
              onChange={(event) => setIsRanked(event.target.checked)}
              className="mt-1"
            />
            <div>
              <p className="font-medium text-white">This is a ranked list</p>
              <p className="text-xs text-white/50">Films will have an explicit order.</p>
            </div>
          </label>

          <div>
            <label className="text-sm font-medium text-white">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              {tags.map((tag) => (
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
                placeholder={tags.length >= 10 ? "Max 10 tags" : "Add tags..."}
                disabled={tags.length >= 10}
                className="min-w-[140px] flex-1 bg-transparent text-sm text-white outline-none"
              />
            </div>
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
              onClick={handleSave}
              disabled={saving}
              className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
