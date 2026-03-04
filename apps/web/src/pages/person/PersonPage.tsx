import { useEffect, useState } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  Calendar,
  Film,
  Instagram,
  MapPin,
  Twitter,
} from "lucide-react"
import Header from "../../components/layout/Header"
import { personService, type Person, type PersonCredits } from "../../services/personService"

export default function PersonPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState<Person | null>(null)
  usePageTitle(person?.name ?? null)
  const [credits, setCredits] = useState<PersonCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"acting" | "directing" | "writing">(
    "acting",
  )
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const idle = (cb: () => void) => {
      if ("requestIdleCallback" in window) {
        ; (window as any).requestIdleCallback(cb)
      } else {
        setTimeout(cb, 0)
      }
    }
    idle(() => setReady(true))
  }, [])

  useEffect(() => {
    if (!ready) return
    let active = true

    const fetchPerson = async () => {
      if (!id || Number.isNaN(Number(id))) {
        setError("Invalid person id")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        const data = await personService.getPersonDetails(Number(id))
        if (!active) return
        setPerson(data.person)
        setCredits(data.credits)
      } catch (err: any) {
        if (!active) return
        setError(err?.message ?? "Failed to load person")
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchPerson()
    return () => {
      active = false
    }
  }, [id, ready])

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-400">Loading person...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 text-sm text-amber-300 hover:text-amber-200"
          >
            Go back
          </button>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-sm text-slate-400">Person not found.</p>
        </div>
      </div>
    )
  }

  const birthday = person.birthday ? new Date(person.birthday) : null
  const age = birthday
    ? Math.max(0, Math.floor((Date.now() - birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
    : null
  const birthLabel = birthday
    ? `${birthday.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}${age !== null ? ` (${age})` : ""
    }`
    : null
  const profileUrl = person.profilePath
    ? `https://image.tmdb.org/t/p/w300${person.profilePath}`
    : null
  const initials = person.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />

      <section className="bg-gradient-to-br from-[rgb(18,18,24)] via-[rgb(10,10,16)] to-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-amber-300 hover:text-amber-200"
          >
            Back
          </button>
          <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="h-48 w-48 overflow-hidden rounded-full border border-white/10 bg-slate-900/70 shadow-xl">
              {profileUrl ? (
                <img
                  src={profileUrl}
                  alt={person.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-400">
                  {initials || "?"}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h1 className="font-['Outfit'] text-3xl font-semibold text-white md:text-4xl">
                  {person.name}
                </h1>
                {person.knownForDepartment && (
                  <p className="mt-2 text-sm text-slate-400">
                    Known for {person.knownForDepartment}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
                {birthLabel && (
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {birthLabel}
                  </span>
                )}
                {person.placeOfBirth && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {person.placeOfBirth}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {person.imdbId && (
                  <a
                    href={`https://www.imdb.com/name/${person.imdbId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <Film className="h-4 w-4" />
                    IMDb
                  </a>
                )}
                {person.instagramId && (
                  <a
                    href={`https://www.instagram.com/${person.instagramId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {person.twitterId && (
                  <a
                    href={`https://twitter.com/${person.twitterId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-8">
        {person.biography && (
          <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-['Outfit'] text-lg font-semibold text-white">Biography</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {person.biography}
            </p>
          </section>
        )}
        {credits && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-['Outfit'] text-lg font-semibold text-white">
                Filmography{" "}
                <span className="text-sm font-normal text-slate-400">
                  ({credits.acting.length + credits.directing.length + credits.writing.length})
                </span>
              </h2>
            </div>

            <div className="mt-4 border-b border-white/10">
              <div className="flex flex-wrap gap-4">
                {credits.acting.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("acting")}
                    className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${activeTab === "acting"
                        ? "border-indigo-400 text-indigo-200"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Acting ({credits.acting.length})
                  </button>
                )}
                {credits.directing.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("directing")}
                    className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${activeTab === "directing"
                        ? "border-indigo-400 text-indigo-200"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Directing ({credits.directing.length})
                  </button>
                )}
                {credits.writing.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("writing")}
                    className={`-mb-px border-b-2 pb-2 text-sm font-semibold transition ${activeTab === "writing"
                        ? "border-indigo-400 text-indigo-200"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                  >
                    Writing ({credits.writing.length})
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
              {(activeTab === "acting"
                ? credits.acting
                : activeTab === "directing"
                  ? credits.directing
                  : credits.writing
              ).map((credit) => {
                const year = credit.release_date
                  ? new Date(credit.release_date).getFullYear()
                  : null
                const posterUrl = credit.poster_path
                  ? `https://image.tmdb.org/t/p/w342${credit.poster_path}`
                  : null
                return (
                  <Link
                    key={`${credit.id}-${credit.title}`}
                    to={`/films/${credit.id}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 transition hover:scale-[1.02] hover:border-white/30 hover:ring-2 hover:ring-white/20"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-900/70">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={credit.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-500">
                          No poster
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2">
                      <p className="line-clamp-2 text-sm font-semibold text-white">
                        {credit.title}
                      </p>
                      {activeTab === "acting" && credit.character && (
                        <p className="text-xs text-slate-400">{credit.character}</p>
                      )}
                      {year && <p className="text-xs text-slate-500">{year}</p>}
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
