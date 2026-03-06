import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { usePageTitle } from "../../hooks/usePageTitle"
import Header from "../../components/layout/Header"
import ListGrid from "../../components/lists/ListGrid"
import CreateListModal from "../../components/lists/CreateListModal"
import { getMyLists } from "../../services/listApi"
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

  const lists = useMemo(() => {
    if (activeTab === "created") return created
    if (activeTab === "collaborating") return collaborating
    if (activeTab === "liked") return liked
    return saved
  }, [activeTab, created, collaborating, liked, saved])


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
            />
          )}
        </div>
      </main>

      {createOpen && <CreateListModal onClose={() => setCreateOpen(false)} />}

    </div>
  )
}
