import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { X } from "lucide-react"
import { getUsersWhoLiked } from "../../services/listApi"

type Liker = {
  id: string
  username: string
  name?: string | null
  avatarUrl?: string | null
}

type WhoLikedModalProps = {
  listId: string
  onClose: () => void
}

export default function WhoLikedModal({ listId, onClose }: WhoLikedModalProps) {
  const [users, setUsers] = useState<Liker[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getUsersWhoLiked(listId, page, 20)
      .then((data) => {
        if (!active) return
        const next = data?.users ?? []
        setUsers((prev) => (page === 1 ? next : [...prev, ...next]))
        setHasMore(next.length === 20)
      })
      .catch((err: any) => {
        if (!active) return
        setError(err?.message ?? "Failed to load likes.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [listId, page])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-['Outfit'] text-xl font-semibold text-white">Liked by</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="max-h-80 space-y-2 overflow-auto">
          {users.map((user) => (
            <Link
              key={user.id}
              to={`/users/${user.username}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/10"
              onClick={onClose}
            >
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/10 text-xs text-white/70">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  user.username.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-medium text-white">@{user.username}</p>
                {user.name && <p className="text-xs text-white/50">{user.name}</p>}
              </div>
            </Link>
          ))}

          {!loading && users.length === 0 && (
            <p className="text-sm text-white/50">No likes yet.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMore || loading}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : hasMore ? "Load more" : "No more"}
          </button>
        </div>
      </div>
    </div>
  )
}
