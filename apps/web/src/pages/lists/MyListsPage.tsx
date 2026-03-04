import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { usePageTitle } from "../../hooks/usePageTitle"
import Header from "../../components/layout/Header"
import ListGrid from "../../components/lists/ListGrid"
import CreateListModal from "../../components/lists/CreateListModal"
import { deleteList, getMyLists, updateList } from "../../services/listApi"
import type { List } from "../../stores/listStore"

type TabKey = "created" | "collaborating" | "liked" | "saved"

export default function MyListsPage() {
  usePageTitle("My Lists")
  const [activeTab, setActiveTab] = useState<TabKey>("created")
  const [created, setCreated] = useState<List[]>([])
  const [collaborating, setCollaborating] = useState<List[]>([])
  const [liked, setLiked] = useState<List[]>([])
  const [saved, setSaved] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string | null>(null)
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [privacyValue, setPrivacyValue] = useState<"" | "PUBLIC" | "PRIVATE">("")
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getMyLists()
      .then((data) => {
        if (!active) return
        setCreated(data.created ?? [])
        setCollaborating(data.collaborating ?? [])
        setLiked(data.liked ?? [])
        setSaved(data.saved ?? [])
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message ?? "Failed to load lists.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateOpen(true)
      const next = new URLSearchParams(searchParams)
      next.delete("create")
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    setSelectedIds([])
    setSelectMode(false)
  }, [activeTab])

  const lists = useMemo(() => {
    if (activeTab === "created") return created
    if (activeTab === "collaborating") return collaborating
    if (activeTab === "liked") return liked
    return saved
  }, [activeTab, created, collaborating, liked, saved])

  const selectedLists = useMemo(
    () => lists.filter((list) => selectedIds.includes(list.id)),
    [lists, selectedIds]
  )

  const toggleSelectMode = () => {
    if (activeTab !== "created") return
    setSelectMode((prev) => {
      if (prev) setSelectedIds([])
      return !prev
    })
  }

  const toggleSelected = (listId: string) => {
    if (activeTab !== "created") return
    setSelectedIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    )
  }

  const resetBulkState = () => {
    setBulkBusy(false)
    setBulkStatus(null)
    setBulkProgress({ done: 0, total: 0 })
  }

  const applyBulkUpdate = async (fn: (list: List) => Promise<void>) => {
    if (!selectedLists.length) return
    setBulkBusy(true)
    setBulkStatus(null)
    setBulkProgress({ done: 0, total: selectedLists.length })
    let processed = 0

    for (const list of selectedLists) {
      try {
        await fn(list)
      } catch (error: any) {
        setBulkStatus(error?.message ?? "Some updates failed.")
      }
      processed += 1
      setBulkProgress({ done: processed, total: selectedLists.length })
    }

    setBulkBusy(false)
  }

  const handleBulkDelete = async () => {
    await applyBulkUpdate(async (list) => {
      if (!list.canEdit && activeTab !== "created") return
      await deleteList(list.id)
      setCreated((prev) => prev.filter((item) => item.id !== list.id))
      setCollaborating((prev) => prev.filter((item) => item.id !== list.id))
      setLiked((prev) => prev.filter((item) => item.id !== list.id))
      setSaved((prev) => prev.filter((item) => item.id !== list.id))
    })
    setSelectedIds([])
    setShowDeleteConfirm(false)
    resetBulkState()
  }

  const handleBulkPrivacy = async () => {
    if (!privacyValue) return
    await applyBulkUpdate(async (list) => {
      if (!list.canEdit) return
      const updated = await updateList(list.id, { privacy: privacyValue })
      setCreated((prev) => prev.map((item) => (item.id === list.id ? { ...item, ...updated } : item)))
      setCollaborating((prev) =>
        prev.map((item) => (item.id === list.id ? { ...item, ...updated } : item))
      )
    })
    setSelectedIds([])
    resetBulkState()
  }

  const handleBulkAddTag = async () => {
    const tag = tagInput.trim()
    if (!tag) return
    await applyBulkUpdate(async (list) => {
      if (!list.canEdit) return
      const nextTags = Array.from(new Set([...(list.tags ?? []), tag]))
      const updated = await updateList(list.id, { tags: nextTags })
      setCreated((prev) => prev.map((item) => (item.id === list.id ? { ...item, ...updated } : item)))
      setCollaborating((prev) =>
        prev.map((item) => (item.id === list.id ? { ...item, ...updated } : item))
      )
    })
    setTagInput("")
    setSelectedIds([])
    resetBulkState()
  }

  const handleBulkExport = () => {
    if (!selectedLists.length) return
    const payload = selectedLists.map((list) => ({
      id: list.id,
      title: list.title,
      slug: list.slug,
      privacy: list.privacy,
      listType: list.listType,
      tags: list.tags,
      filmCount: list.filmCount,
    }))
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "filmly-lists-export.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-['Outfit'] text-3xl font-semibold text-white">My Lists</h1>
            <p className="mt-1 text-sm text-white/60">Manage everything you’ve curated.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === "created" && (
              <button
                type="button"
                onClick={toggleSelectMode}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${selectMode
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                  }`}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-full border border-amber-400/50 bg-amber-400/20 px-5 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/80 hover:bg-amber-400/30"
            >
              Create List
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-b border-white/10 pb-3 text-sm">
          {[
            { key: "created", label: `Created (${created.length})` },
            { key: "collaborating", label: `Collaborating (${collaborating.length})` },
            { key: "liked", label: `Liked (${liked.length})` },
            { key: "saved", label: `Saved (${saved.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${activeTab === tab.key
                ? "border-amber-400 text-amber-200"
                : "border-transparent text-white/50 hover:text-white"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-6 text-rose-200">
              {error}
            </div>
          )}
          {!loading && !error && (
            <ListGrid
              lists={lists}
              onCreate={() => setCreateOpen(true)}
              selectable={selectMode && activeTab === "created"}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
            />
          )}
        </div>
      </main>

      {createOpen && <CreateListModal onClose={() => setCreateOpen(false)} />}

      {selectMode && activeTab === "created" && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgb(10,10,14)]/90 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 text-sm text-white/70">
            <span className="font-semibold text-white">{selectedIds.length} selected</span>
            <div className="h-5 w-px bg-white/10" />
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!selectedIds.length || bulkBusy}
              className="rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1.5 text-sm font-semibold text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Delete selected
            </button>
            <div className="flex items-center gap-2">
              <select
                value={privacyValue}
                onChange={(event) => setPrivacyValue(event.target.value as "PUBLIC" | "PRIVATE" | "")}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
              >
                <option value="">Change privacy</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
              <button
                type="button"
                onClick={handleBulkPrivacy}
                disabled={!privacyValue || !selectedIds.length || bulkBusy}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder="Add tag"
                className="w-36 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70"
              />
              <button
                type="button"
                onClick={handleBulkAddTag}
                disabled={!tagInput.trim() || !selectedIds.length || bulkBusy}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white/80 transition hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add tag
              </button>
            </div>
            <button
              type="button"
              onClick={handleBulkExport}
              disabled={!selectedIds.length}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:border-white/30"
            >
              Export selected
            </button>
            {bulkBusy && (
              <span className="ml-auto text-xs text-white/50">
                Processing {bulkProgress.done}/{bulkProgress.total}
              </span>
            )}
            {!bulkBusy && bulkStatus && (
              <span className="ml-auto text-xs text-rose-200">{bulkStatus}</span>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(16,16,22)] p-6 text-sm">
            <h2 className="text-lg font-semibold text-white">Delete selected lists?</h2>
            <p className="mt-2 text-white/60">
              This will permanently remove {selectedIds.length} list
              {selectedIds.length === 1 ? "" : "s"}.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70 transition hover:border-white/30"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
