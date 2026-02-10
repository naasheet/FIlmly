import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../services/api"
import { searchFilms } from "../../services/filmService"
import { resolvePosterUrl } from "../../utils/image"

type FilmSummary = {
  id: number
  title: string
  releaseDate?: string | null
  posterPath?: string | null
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

type SearchResult =
  | { type: "film"; film: FilmSummary }
  | { type: "person"; person: PersonSummary }
  | { type: "user"; user: UserSummary }

type SearchType = "film" | "director" | "cast" | "user"

type FilmSearchProps = {
  placeholder?: string
  onSelect?: (film: FilmSummary) => void
}

export default function FilmSearch({ placeholder, onSelect }: FilmSearchProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [searchType, setSearchType] = useState<SearchType>("film")
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const requestIdRef = useRef(0)
  const blurTimeoutRef = useRef<number | null>(null)

  const trimmed = useMemo(() => query.trim(), [query])

    useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen])

useEffect(() => {
    if (!trimmed) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const currentRequestId = ++requestIdRef.current
    const handle = window.setTimeout(async () => {
      try {
        if (searchType == "film") {
          const data = await searchFilms({ query: trimmed, page: 1 })
          if (requestIdRef.current != currentRequestId) {
            return
          }
          setResults((data?.results ?? []).map((item: any) => ({ type: "film", film: item.film })))
          return
        }

        if (searchType == "user") {
          const res = await api.get("/users/search", { params: { query: trimmed } })
          if (requestIdRef.current != currentRequestId) {
            return
          }
          const users = (res.data?.results ?? []) as UserSummary[]
          setResults(users.map((user) => ({ type: "user", user })))
          return
        }

        const peopleRes = await api.get("/people/search", { params: { query: trimmed, page: 1 } })
        if (requestIdRef.current != currentRequestId) {
          return
        }
        let people = (peopleRes.data?.results ?? []) as PersonSummary[]
        if (searchType == "cast") {
          people = people.filter(
            (person) => person.known_for_department?.toLowerCase() == "acting"
          )
          people = people.filter((person) => (person.known_for?.length ?? 0) > 0)
          people = people.sort(
            (a, b) => (b.known_for?.length ?? 0) - (a.known_for?.length ?? 0)
          )
        }
        if (searchType == "director") {
          people = people.filter(
            (person) => person.known_for_department?.toLowerCase() == "directing"
          )
          people = people.filter((person) => (person.known_for?.length ?? 0) > 0)
          people = people.sort(
            (a, b) => (b.known_for?.length ?? 0) - (a.known_for?.length ?? 0)
          )
        }
        setResults(people.map((person) => ({ type: "person", person })))
        return
      } catch (err: any) {
        if (requestIdRef.current != currentRequestId) {
          return
        }
        setError(err?.message ?? "Failed to search")
        setResults([])
      } finally {
        if (requestIdRef.current == currentRequestId) {
          setLoading(false)
        }
      }
    }, 400)

    return () => window.clearTimeout(handle)
  }, [trimmed, searchType])

  const handleSelect = (film: FilmSummary) => {
    setQuery(film.title)
    setOpen(false)
    onSelect?.(film)
  }

  const handleSelectUser = (user: UserSummary) => {
    setQuery(user.name ?? user.username)
    setOpen(false)
    navigate(`/users/${user.username}`)
  }

  const handleSelectPerson = (person: PersonSummary) => {
    setQuery(person.name)
    setOpen(false)
    navigate(`/person/${person.id}`)
  }

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => setOpen(false), 150)
  }

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current)
      blurTimeoutRef.current = null
    }
    if (trimmed) {
      setOpen(true)
    }
  }

  return (
    <div className="relative w-full">
      <label className="sr-only" htmlFor="film-search">
        Search
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 shadow-lg shadow-black/10 backdrop-blur">
        <input
          id="film-search"
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              const trimmedValue = query.trim()
              if (!trimmedValue) return
              setOpen(false)
              const nextQuery = encodeURIComponent(trimmedValue)
              navigate(`/search?query=${nextQuery}&type=${searchType}`)
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={
            placeholder ??
            (searchType == "user"
              ? "Search users..."
              : searchType == "director"
              ? "Search directors..."
              : searchType == "cast"
              ? "Search cast..."
              : "Search films...")
          }
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/90 transition hover:border-amber-400/40 hover:text-amber-200"
          >
            {searchType}
            <svg
              className="h-3.5 w-3.5 text-amber-200/70 transition-transform duration-300"
              style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div
            className={`absolute right-0 top-full mt-2 w-36 origin-top-right rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ${
              menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
            }`}
          >
            {(["film", "director", "cast", "user"] as SearchType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSearchType(type)
                  setResults([])
                  setOpen(Boolean(trimmed))
                  setMenuOpen(false)
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] transition ${
                  type == searchType
                    ? "bg-amber-400/10 text-amber-200"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        {loading && <span className="text-xs text-slate-400"></span>}
      </div>

      {open && (loading || error || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl shadow-black/40 backdrop-blur">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {!error && results.length == 0 && !loading && (
            <div className="px-3 py-2 text-xs text-slate-400">No results found.</div>
          )}

          <ul className="mt-1 max-h-72 space-y-2 overflow-auto">
            {results.map((item) => {
              if (item.type == "film") {
                const film = item.film
                const year = film.releaseDate ? new Date(film.releaseDate).getFullYear() : null
                const posterUrl = resolvePosterUrl(film.posterPath, "w92")
                return (
                  <li key={`film-${film.id}`}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelect(film)}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex h-10 w-8 items-center justify-center overflow-hidden rounded-lg bg-slate-800/70 text-xs text-slate-400">
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={film.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          "?"
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="font-semibold text-white">{film.title}</span>
                        <span className="text-xs text-slate-400">
                          {year ? `${year}` : "Release date unknown"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">Film</span>
                    </button>
                  </li>
                )
              }

              if (item.type == "person") {
                const person = item.person
                const profileUrl = person.profile_path
                  ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                  : null
                return (
                  <li key={`person-${person.id}`}>
                    <button
                      type="button"
                      onMouseDown={() => handleSelectPerson(person)}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800/70 text-xs text-slate-400">
                        {profileUrl ? (
                          <img
                            src={profileUrl}
                            alt={person.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          "?"
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="font-semibold text-white">{person.name}</span>
                        <span className="text-xs text-slate-400">
                          {person.known_for_department ?? "Person"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">Person</span>
                    </button>
                  </li>
                )
              }

              const user = item.user
              return (
                <li key={`user-${user.id}`}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelectUser(user)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white/5 px-3 py-2 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-800/70 text-xs text-slate-400">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name ?? user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (user.name ?? user.username).slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="font-semibold text-white">
                        {user.name ?? user.username}
                      </span>
                      <span className="text-xs text-slate-400">@{user.username}</span>
                    </div>
                    <span className="text-xs text-slate-500">User</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
