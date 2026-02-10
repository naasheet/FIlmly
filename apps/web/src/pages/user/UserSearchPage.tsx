import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import Header from "../../components/layout/Header"
import api, { normalizeApiError } from "../../services/api"

type UserResult = {
  id: string
  username: string
  name?: string | null
  avatarUrl?: string | null
}

export default function UserSearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = useMemo(() => query.trim(), [query])

  useEffect(() => {
    if (!trimmed) {
      setResults([])
      setError(null)
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    const handle = window.setTimeout(async () => {
      try {
        const res = await api.get("/users/search", { params: { query: trimmed } })
        if (!active) return
        setResults((res.data?.results as UserResult[]) ?? [])
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }, 350)

    return () => {
      active = false
      window.clearTimeout(handle)
    }
  }, [trimmed])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="font-['Outfit'] text-3xl font-semibold text-white">Search profiles</h1>
        <p className="mt-2 text-base text-slate-400">
          Find people by username or name.
        </p>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a username or name"
            className="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>

        {loading && (
          <p className="mt-4 text-base text-slate-400">Searching profiles...</p>
        )}
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-base text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && trimmed && results.length === 0 && (
          <p className="mt-4 text-base text-slate-400">No profiles found.</p>
        )}

        {results.length > 0 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {results.map((user) => (
              <Link
                key={user.id}
                to={`/users/${user.username}`}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name ?? user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                      {(user.name ?? user.username).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">
                    {user.name ?? user.username}
                  </p>
                  <p className="text-sm text-slate-400">@{user.username}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
