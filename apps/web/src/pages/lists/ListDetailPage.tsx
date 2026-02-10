import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Bookmark, Heart, Search, Trash2, UserPlus, X } from "lucide-react"
import Header from "../../components/layout/Header"
import {
  deleteList,
  getListFull,
  inviteContributor,
  likeList,
  removeContributor,
  saveList,
  searchUsers,
  unlikeList,
  unsaveList,
} from "../../services/listApi"
import type { List, ListContributor } from "../../stores/listStore"
import WhoLikedModal from "../../components/lists/WhoLikedModal"
import ActivityFeed from "../../components/lists/ActivityFeed"
import ListStatisticsPanel from "../../components/lists/ListStatisticsPanel"
import EditListModal from "../../components/lists/EditListModal"
import { resolvePosterUrl } from "../../utils/image"
import { useAuthStore } from "../../stores/authStore"

const PAGE_SIZE = 24

type SearchResultUser = {
  id: string
  username?: string | null
  name?: string | null
  avatarUrl?: string | null
}

function getDisplayName(user?: { name?: string | null; username?: string | null }) {
  return user?.name || user?.username || "Unknown user"
}

function getUserInitials(name?: string | null, username?: string | null) {
  const source = (name || username || "U").trim()
  if (!source) return "U"
  const parts = source.split(" ").filter(Boolean)
  if (parts.length > 1) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function isAcceptedContributor(contributor: ListContributor) {
  return contributor.status === "ACCEPTED" || contributor.role === "OWNER"
}

function collaboratorRoleLabel(role: ListContributor["role"]) {
  return role === "OWNER" ? "owner" : "editor"
}

export default function ListDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const user = useAuthStore((state) => state.user)
  const accessToken = useAuthStore((state) => state.accessToken)
  const authHydrated = useAuthStore((state) => state.isHydrated)

  const [list, setList] = useState<List | null>(null)
  const [films, setFilms] = useState<NonNullable<List["films"]>>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filmsHasMore, setFilmsHasMore] = useState(false)
  const [filmsLoading, setFilmsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [likeBusy, setLikeBusy] = useState(false)

  const [isSaved, setIsSaved] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveCount, setSaveCount] = useState(0)

  const [toast, setToast] = useState<string | null>(null)
  const [likesOpen, setLikesOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [listStats, setListStats] = useState<any>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)

  const [collabQuery, setCollabQuery] = useState("")
  const [collabResults, setCollabResults] = useState<SearchResultUser[]>([])
  const [collabSearching, setCollabSearching] = useState(false)
  const [collabError, setCollabError] = useState<string | null>(null)
  const [inviteBusyId, setInviteBusyId] = useState<string | null>(null)
  const [removeBusyId, setRemoveBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !authHydrated) return

    let active = true
    setLoading(true)
    setFilmsLoading(true)
    setError(null)
    setToast(null)
    setSelectedGenre(null)

    getListFull(slug, 1, PAGE_SIZE)
      .then((data) => {
        if (!active) return
        const payload = data as List & { totalFilms?: number; stats?: any; isSaved?: boolean }
        const incoming = Array.isArray(payload.films) ? payload.films : []
        const totalFilms = payload.totalFilms ?? incoming.length

        setList(payload)
        setFilms(incoming)
        setCurrentPage(1)
        setFilmsHasMore(incoming.length < totalFilms)
        setIsLiked(Boolean(payload.isLiked))
        setLikeCount(payload.likeCount ?? 0)
        setIsSaved(Boolean(payload.isSaved))
        setSaveCount(payload.followerCount ?? 0)
        setListStats(payload.stats ?? null)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message ?? "Unable to load list.")
        setList(null)
        setFilms([])
        setFilmsHasMore(false)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
        setFilmsLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug, authHydrated, user?.id])

  useEffect(() => {
    if (!list || list.listType !== "COLLABORATIVE" || !list.isOwner) {
      setCollabResults([])
      setCollabError(null)
      return
    }

    const query = collabQuery.trim()
    if (!query) {
      setCollabResults([])
      setCollabError(null)
      return
    }

    let active = true
    const handle = setTimeout(() => {
      setCollabSearching(true)
      setCollabError(null)

      searchUsers(query)
        .then((results) => {
          if (!active) return
          const existingUserIds = new Set((list.contributors ?? []).map((item) => item.userId))
          const filtered = results.filter((candidate) => {
            if (!candidate?.id) return false
            if (candidate.id === user?.id) return false
            return !existingUserIds.has(candidate.id)
          })
          setCollabResults(filtered)
        })
        .catch((err: any) => {
          if (!active) return
          setCollabError(err?.message ?? "Failed to search users.")
          setCollabResults([])
        })
        .finally(() => {
          if (active) setCollabSearching(false)
        })
    }, 300)

    return () => {
      active = false
      clearTimeout(handle)
    }
  }, [collabQuery, list, user?.id])

  const acceptedContributors = useMemo(
    () =>
      (list?.contributors ?? [])
        .filter(isAcceptedContributor)
        .filter((item) => item.userId !== user?.id),
    [list?.contributors, user?.id]
  )
  const pendingContributors = useMemo(
    () =>
      (list?.contributors ?? []).filter(
        (item) => item.status === "PENDING" && item.role !== "OWNER" && item.userId !== user?.id
      ),
    [list?.contributors, user?.id]
  )

  const isCollaborative = list?.listType === "COLLABORATIVE"
  const isOwner = Boolean(list?.isOwner)
  const canEdit = Boolean(list?.canEdit)

  const genreFilms = (films ?? [])
    .map((item) => item.film)
    .filter((film): film is NonNullable<typeof film> => Boolean(film))
    .filter((film) => (selectedGenre ? film.genres?.includes(selectedGenre) : false))

  const ensureAuthedOrRedirect = () => {
    if (accessToken) return true
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    navigate(`/login?next=${next}`)
    return false
  }

  const handleLoadMore = async () => {
    if (!slug || filmsLoading || !filmsHasMore) return

    const nextPage = currentPage + 1
    setFilmsLoading(true)
    setToast(null)

    try {
      const payload = (await getListFull(slug, nextPage, PAGE_SIZE)) as List & {
        totalFilms?: number
      }
      const incoming = Array.isArray(payload.films) ? payload.films : []
      const totalFilms = payload.totalFilms ?? incoming.length

      setFilms((prev) => {
        const seen = new Set(prev.map((item) => item.id))
        const merged = [...prev, ...incoming.filter((item) => !seen.has(item.id))]
        setFilmsHasMore(merged.length < totalFilms)
        return merged
      })
      setCurrentPage(nextPage)
    } catch (err: any) {
      setToast(err?.message ?? "Failed to load more films.")
    } finally {
      setFilmsLoading(false)
    }
  }

  const handleLike = async () => {
    if (!list || likeBusy) return
    if (!ensureAuthedOrRedirect()) return

    setLikeBusy(true)
    setToast(null)

    const nextLiked = !isLiked
    const prevLiked = isLiked
    const prevCount = likeCount

    setIsLiked(nextLiked)
    setLikeCount(Math.max(0, likeCount + (nextLiked ? 1 : -1)))

    try {
      const result = nextLiked ? await likeList(list.id) : await unlikeList(list.id)
      setLikeCount(result.likeCount ?? prevCount)
    } catch (err: any) {
      setIsLiked(prevLiked)
      setLikeCount(prevCount)
      setToast(err?.message ?? "Failed to update like.")
    } finally {
      setLikeBusy(false)
    }
  }

  const handleSave = async () => {
    if (!list || saveBusy) return
    if (!ensureAuthedOrRedirect()) return

    setSaveBusy(true)
    setToast(null)

    const nextSaved = !isSaved
    const prevSaved = isSaved
    const prevCount = saveCount

    setIsSaved(nextSaved)
    setSaveCount(Math.max(0, saveCount + (nextSaved ? 1 : -1)))

    try {
      if (nextSaved) {
        await saveList(list.id)
      } else {
        await unsaveList(list.id)
      }
    } catch (err: any) {
      setIsSaved(prevSaved)
      setSaveCount(prevCount)
      setToast(err?.message ?? "Failed to update save.")
    } finally {
      setSaveBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!list || !isOwner || deleteBusy) return
    const confirmed = window.confirm("Delete this list permanently?")
    if (!confirmed) return

    setDeleteBusy(true)
    setToast(null)
    try {
      await deleteList(list.id)
      navigate("/me/lists")
    } catch (err: any) {
      setToast(err?.message ?? "Failed to delete list.")
    } finally {
      setDeleteBusy(false)
    }
  }

  const handleInvite = async (target: SearchResultUser) => {
    if (!list || !isOwner || inviteBusyId) return

    setInviteBusyId(target.id)
    setCollabError(null)
    setToast(null)

    try {
      const invited = await inviteContributor(list.id, target.id)
      setList((prev) => {
        if (!prev) return prev
        const current = prev.contributors ?? []
        if (current.some((item) => item.id === invited.id || item.userId === target.id)) {
          return prev
        }
        return {
          ...prev,
          contributors: [{ ...invited, user: invited.user ?? target }, ...current],
        }
      })
      setCollabQuery("")
      setCollabResults([])
      setToast("Invitation sent.")
    } catch (err: any) {
      setCollabError(err?.message ?? "Failed to invite collaborator.")
    } finally {
      setInviteBusyId(null)
    }
  }

  const handleRemoveContributor = async (contributor: ListContributor) => {
    if (!list || !isOwner || removeBusyId || contributor.role === "OWNER") return

    const confirmed = window.confirm("Remove this collaborator?")
    if (!confirmed) return

    setRemoveBusyId(contributor.id)
    setToast(null)
    try {
      await removeContributor(list.id, contributor.id)
      setList((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          contributors: (prev.contributors ?? []).filter((item) => item.id !== contributor.id),
        }
      })
      setToast("Collaborator removed.")
    } catch (err: any) {
      setToast(err?.message ?? "Failed to remove collaborator.")
    } finally {
      setRemoveBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-6 pb-16 pt-8">
        {!authHydrated && (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            </div>
          </div>
        )}

        {authHydrated && loading && (
          <div className="space-y-4">
            <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="h-24 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && !list && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
            List not found.
          </div>
        )}

        {!loading && list && (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <div className="relative h-60 w-full bg-gradient-to-br from-white/10 to-white/5">
                {list.coverImagePath && (
                  <img
                    src={resolvePosterUrl(list.coverImagePath, "w1280") ?? ""}
                    alt={list.title}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgb(8,8,12)] via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 px-6 pb-6">
                  <h1 className="font-['Outfit'] text-4xl font-semibold text-white">
                    {list.title}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span>@{list.user?.username ?? "creator"}</span>
                    <span>|</span>
                    <span>
                      Created {list.createdAt ? new Date(list.createdAt).toLocaleDateString() : "--"}
                    </span>
                    <span>|</span>
                    <span>
                      Updated {list.updatedAt ? new Date(list.updatedAt).toLocaleDateString() : "--"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span className="text-white/50">Films</span>
                <span className="text-lg font-semibold text-white">{list.filmCount}</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <button
                type="button"
                onClick={() => setLikesOpen(true)}
                className="flex items-center gap-2 text-left transition hover:text-rose-200"
              >
                <Heart className="h-4 w-4 text-rose-300" />
                <span className="text-lg font-semibold text-white">{likeCount}</span>
              </button>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-white/50">Saves</span>
                <span className="text-lg font-semibold text-white">{saveCount}</span>
              </div>
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLike}
                disabled={likeBusy}
                className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isLiked
                    ? "border-rose-400/40 bg-rose-400/10 text-rose-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                } ${likeBusy ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <Heart
                  className={`h-4 w-4 transition-transform ${
                    isLiked ? "fill-rose-400 text-rose-300" : ""
                  } ${likeBusy ? "" : "group-active:scale-110"}`}
                />
                <span className="text-base">{isLiked ? "Liked" : "Like"}</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saveBusy}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  isSaved
                    ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                } ${saveBusy ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <Bookmark
                  className={`h-4 w-4 ${isSaved ? "fill-amber-400 text-amber-300" : ""}`}
                />
                {isSaved ? "Saved" : "Save"}
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20"
                >
                  Edit
                </button>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  className={`flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-400/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20 ${
                    deleteBusy ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteBusy ? "Deleting..." : "Delete"}
                </button>
              )}
            </section>

            {toast && (
              <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
                {toast}
              </div>
            )}

            {likesOpen && list && (
              <WhoLikedModal listId={list.id} onClose={() => setLikesOpen(false)} />
            )}

            {editOpen && list && (
              <EditListModal
                list={list}
                onClose={() => setEditOpen(false)}
                onUpdated={(updated) => {
                  setList((prev) => ({
                    ...(prev ?? updated),
                    ...updated,
                  }))
                }}
              />
            )}

            <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-['Outfit'] text-lg font-semibold text-white">Films</h3>
                  {list.isRanked && (
                    <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
                      Ranked
                    </span>
                  )}
                </div>

                {Array.isArray(films) && films.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...(Array.isArray(films) ? films : [])]
                      .sort((a, b) => {
                        if (list.isRanked) {
                          return (a.rank ?? 0) - (b.rank ?? 0)
                        }
                        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
                      })
                      .map((item, index) => (
                        <a
                          key={item.id}
                          href={`/films/${item.film?.id ?? item.filmId}`}
                          className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20 hover:shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
                        >
                          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            {item.film?.posterPath ? (
                              <img
                                src={resolvePosterUrl(item.film.posterPath, "w342") ?? ""}
                                alt={item.film.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">
                                No poster
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              {list.isRanked && (
                                <span className="text-xs font-semibold text-amber-200">
                                  #{item.rank ?? index + 1}
                                </span>
                              )}
                              <p className="text-sm font-semibold text-white">
                                {item.film?.title ?? "Untitled"}
                              </p>
                              {item.film?.releaseDate && (
                                <span className="text-xs text-white/50">
                                  {new Date(item.film.releaseDate).getFullYear()}
                                </span>
                              )}
                            </div>
                            {item.notes && <p className="mt-2 text-xs text-white/60">{item.notes}</p>}
                          </div>
                        </a>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    {filmsLoading ? "Loading films..." : "No films added yet."}
                  </div>
                )}

                {filmsHasMore && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={filmsLoading}
                      className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {filmsLoading ? "Loading..." : "Load more films"}
                    </button>
                  </div>
                )}
              </div>

              <aside className="space-y-6">
                {isCollaborative && (
                  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-white">Collaborators</h3>
                      </div>
                      {isOwner && (
                        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold text-amber-200">
                          Owner
                        </span>
                      )}
                    </div>

                    {isOwner && (
                      <div className="mb-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                          <UserPlus className="h-3.5 w-3.5" />
                          Invite collaborator
                        </div>

                        <div>
                          <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                            <input
                              value={collabQuery}
                              onChange={(event) => setCollabQuery(event.target.value)}
                              placeholder="Search by username or name"
                              className="w-full rounded-xl border border-white/10 bg-[rgb(10,10,14)] py-2 pl-9 pr-3 text-sm text-white/80 outline-none placeholder:text-white/35 focus:border-amber-400/40"
                            />
                          </div>
                        </div>

                        {collabSearching && (
                          <p className="text-xs text-white/40">Searching users...</p>
                        )}
                        {collabError && <p className="text-xs text-rose-300">{collabError}</p>}

                        {!collabSearching && collabQuery.trim() && collabResults.length === 0 && (
                          <p className="text-xs text-white/40">No matching users.</p>
                        )}

                        {collabResults.length > 0 && (
                          <div className="space-y-2">
                            {collabResults.map((candidate) => (
                              <div
                                key={candidate.id}
                                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  {candidate.avatarUrl ? (
                                    <img
                                      src={candidate.avatarUrl}
                                      alt={getDisplayName(candidate)}
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/70">
                                      {getUserInitials(candidate.name, candidate.username)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-medium text-white">
                                      {getDisplayName(candidate)}
                                    </p>
                                    <p className="text-xs text-white/40">
                                      @{candidate.username ?? candidate.id.slice(0, 8)}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleInvite(candidate)}
                                  disabled={inviteBusyId === candidate.id}
                                  className={`rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200 transition hover:border-amber-400/70 hover:bg-amber-400/20 ${
                                    inviteBusyId === candidate.id
                                      ? "cursor-not-allowed opacity-70"
                                      : ""
                                  }`}
                                >
                                  {inviteBusyId === candidate.id ? "Inviting..." : "Invite"}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {acceptedContributors.length === 0 && (
                        <p className="text-xs text-white/40">No collaborators yet.</p>
                      )}
                      {acceptedContributors.map((contributor) => (
                        <div
                          key={contributor.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            {contributor.user?.avatarUrl ? (
                              <img
                                src={contributor.user.avatarUrl}
                                alt={getDisplayName(contributor.user)}
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/70">
                                {getUserInitials(contributor.user?.name, contributor.user?.username)}
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-medium text-white">
                                {getDisplayName(contributor.user)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                                <span>@{contributor.user?.username ?? contributor.userId.slice(0, 8)}</span>
                                <span>|</span>
                                <span className="uppercase">{collaboratorRoleLabel(contributor.role)}</span>
                              </div>
                            </div>
                          </div>

                          {isOwner && contributor.role !== "OWNER" && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContributor(contributor)}
                              disabled={removeBusyId === contributor.id}
                              className={`flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-400/70 hover:bg-rose-400/20 ${
                                removeBusyId === contributor.id ? "cursor-not-allowed opacity-70" : ""
                              }`}
                            >
                              <X className="h-3 w-3" />
                              {removeBusyId === contributor.id ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {isOwner && pendingContributors.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
                          Pending invites
                        </p>
                        <div className="space-y-2">
                          {pendingContributors.map((contributor) => (
                            <div
                              key={contributor.id}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2"
                            >
                              <div>
                                <p className="text-sm text-white">
                                  {getDisplayName(contributor.user)}
                                </p>
                                <p className="text-xs text-white/40">
                                  @{contributor.user?.username ?? contributor.userId.slice(0, 8)} |{" "}
                                  {collaboratorRoleLabel(contributor.role)}
                                </p>
                              </div>
                              <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                                pending
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!isOwner && (
                      <p className="mt-3 text-xs text-white/40">
                        Only the owner can manage collaborators.
                      </p>
                    )}
                  </section>
                )}

                <ListStatisticsPanel
                  films={films ?? []}
                  stats={listStats ?? undefined}
                  selectedGenre={selectedGenre}
                  onSelectGenre={setSelectedGenre}
                />

                {selectedGenre && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/70">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-white">{selectedGenre}</h3>
                        <p className="text-xs text-white/40">
                          {genreFilms.length} film{genreFilms.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGenre(null)}
                        className="text-xs text-amber-200 hover:text-amber-100"
                      >
                        Clear
                      </button>
                    </div>

                    {genreFilms.length === 0 ? (
                      <p className="mt-3 text-xs text-white/40">No films match this genre.</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {genreFilms.map((film) => (
                          <a
                            key={film.id}
                            href={`/films/${film.id}`}
                            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/[0.08]"
                          >
                            <span className="font-medium text-white">{film.title}</span>
                            <span className="text-xs text-white/40">-&gt;</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <ActivityFeed listId={list.id} />
              </aside>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
