import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import Header from "../../components/layout/Header"
import FilmCard from "../../components/film/FilmCard"
import api, { normalizeApiError } from "../../services/api"
import { searchFilms } from "../../services/filmService"

type SearchType = "film" | "director" | "cast" | "user"

type FilmSummary = {
  id: number
  title: string
  releaseDate?: string | null
  posterPath?: string | null
  rating?: number | null
}

type PersonSummary = {
  id: number
  name: string
  known_for_department?: string | null
  profile_path?: string | null
  known_for?: Array<{ id: number; media_type?: string }>
}

type UserSummary = {
  id: string
  username: string
  name?: string | null
  avatarUrl?: string | null
}

export default function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const query = (searchParams.get("query") ?? "").trim()
  const type = (searchParams.get("type") as SearchType | null) ?? "film"

  const [filmResults, setFilmResults] = useState<FilmSummary[]>([])
  const [peopleResults, setPeopleResults] = useState<PersonSummary[]>([])
  const [userResults, setUserResults] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const headerLabel = useMemo(() => {
    if (type === "cast") return "Cast"
    if (type === "director") return "Directors"
    if (type === "user") return "Users"
    return "Films"
  }, [type])

  useEffect(() => {
    if (!query) {
      setFilmResults([])
      setPeopleResults([])
      setUserResults([])
      return
    }

    let active = true
    setLoading(true)
    setError(null)

    const fetchResults = async () => {
      try {
        if (type === "film") {
          const data = await searchFilms({ query, page: 1 })
          if (!active) return
          const results = (data?.results ?? []).map((item: any) => ({
            id: item.film.id,
            title: item.film.title,
            releaseDate: item.film.releaseDate,
            posterPath: item.film.posterPath,
            rating: item.film.tmdbRating ?? null,
          }))
          setFilmResults(results)
          return
        }

        if (type === "user") {
          const res = await api.get("/users/search", { params: { query } })
          if (!active) return
          setUserResults((res.data?.results ?? []) as UserSummary[])
          return
        }

        const peopleRes = await api.get("/people/search", { params: { query, page: 1 } })
        if (!active) return
        let people = (peopleRes.data?.results ?? []) as PersonSummary[]
        if (type === "cast") {
          people = people.filter(
            (person) => person.known_for_department?.toLowerCase() === "acting",
          )
          people = people.filter((person) => (person.known_for?.length ?? 0) > 0)
          people = people.sort(
            (a, b) => (b.known_for?.length ?? 0) - (a.known_for?.length ?? 0),
          )
        }
        if (type === "director") {
          people = people.filter(
            (person) => person.known_for_department?.toLowerCase() === "directing",
          )
          people = people.filter((person) => (person.known_for?.length ?? 0) > 0)
          people = people.sort(
            (a, b) => (b.known_for?.length ?? 0) - (a.known_for?.length ?? 0),
          )
        }
        setPeopleResults(people)
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchResults()
    return () => {
      active = false
    }
  }, [query, type])

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)]">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-['Outfit'] text-3xl font-bold text-white">
              Search {headerLabel}
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Results for “{query || "…"}”
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/10"
          >
            Back
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-400">Searching {headerLabel.toLowerCase()}...</p>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && query && type === "film" && (
          <>
            {filmResults.length === 0 ? (
              <p className="text-sm text-slate-400">No films found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filmResults.map((film) => (
                  <FilmCard
                    key={film.id}
                    id={film.id}
                    title={film.title}
                    releaseDate={film.releaseDate}
                    posterPath={film.posterPath}
                    rating={film.rating}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && query && (type === "cast" || type === "director") && (
          <>
            {peopleResults.length === 0 ? (
              <p className="text-sm text-slate-400">No people found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {peopleResults.map((person) => (
                  <Link
                    key={person.id}
                    to={`/person/${person.id}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                          {person.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{person.name}</p>
                      <p className="text-sm text-slate-400">
                        {person.known_for_department ?? "Person"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && query && type === "user" && (
          <>
            {userResults.length === 0 ? (
              <p className="text-sm text-slate-400">No users found.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {userResults.map((user) => (
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
          </>
        )}

        {!query && (
          <p className="text-sm text-slate-400">Type a search to see results.</p>
        )}
      </main>
    </div>
  )
}
