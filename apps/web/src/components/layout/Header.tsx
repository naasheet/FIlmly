import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Plus, Book, ListPlus } from "lucide-react"
import { useAuthStore } from "../../stores/authStore"
import api from "../../services/api"
import { logout as logoutRequest } from "../../services/authService"
import FilmSearch from "../film/FilmSearch"
import NotificationsBell from "./NotificationsBell"

const navLinks = [
  { label: "Discover", href: "/" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Lists", href: "/lists" },
]

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || ""
  if (!source) return "FL"
  const parts = source.split(" ")
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const user = useAuthStore((state) => state.user)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const createRef = useRef<HTMLDivElement | null>(null)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const clearAuth = useAuthStore((state) => state.clearAuth)
  const setUser = useAuthStore((state) => state.setUser)
  const navigate = useNavigate()
  const userId = user?.id ?? null
  const userAvatarUrl = user?.avatarUrl ?? null
  const profileKey = `${userId ?? ""}:${userAvatarUrl ?? ""}`

  useEffect(() => {
    if (!menuOpen && !createOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false)
      }
      if (createRef.current && !createRef.current.contains(target)) {
        setCreateOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [menuOpen, createOpen])

  useEffect(() => {
    setProfileLoaded(false)
  }, [userId])

  useEffect(() => {
    if (!userId || userAvatarUrl || profileLoaded) return
    let active = true
    api
      .get("/users/me")
      .then((res) => {
        if (!active) return
        if (res.data) {
          setUser({ ...user, ...res.data })
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setProfileLoaded(true)
      })
    return () => {
      active = false
    }
  }, [profileKey, profileLoaded, setUser])

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken)
      }
    } finally {
      clearAuth()
    }
  }

  const redirectToLogin = () => {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`)
    navigate(`/login?next=${next}`)
  }

  return (
    <header className="glass sticky top-0 z-50 border-b border-white/5">
      {/* Ambient glow accent line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-sm font-bold text-black shadow-lg shadow-amber-500/20 transition-all duration-500 group-hover:shadow-amber-500/40 group-hover:scale-105">
            <span className="relative z-10">FL</span>
            {/* Film strip accent */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-black/20 via-transparent to-black/20" />
          </div>
          <div className="transition-transform duration-300 group-hover:translate-x-0.5">
            <p className="font-['Outfit'] text-base font-semibold tracking-tight text-white">Filmly</p>
            <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-amber-400/80">Curate your cinema</p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              onClick={(event) => {
                if (!user && (link.href === "/watchlist" || link.href === "/activity")) {
                  event.preventDefault()
                  redirectToLogin()
                }
              }}
              className={({ isActive }) =>
                `nav-link text-sm font-medium ${isActive ? "active text-amber-400" : "text-slate-300 hover:text-white"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <div className="hidden max-w-xs flex-1 px-4 lg:flex">
          <FilmSearch onSelect={(film) => navigate(`/films/${film.id}`)} />
        </div>

        {/* Create Button + Dropdown */}
        {user && (
          <div className="relative hidden md:block" ref={createRef}>
            <button
              type="button"
              onClick={() => setCreateOpen((prev) => !prev)}
              className={`group flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 ${createOpen
                  ? "border-amber-400/50 bg-amber-400/10 text-amber-300"
                  : "border-amber-400/30 bg-amber-400/10 text-amber-300 hover:border-amber-400/50 hover:bg-amber-400/20"
                }`}
            >
              <Plus className={`h-4 w-4 transition-transform duration-300 ${createOpen ? "rotate-45" : ""}`} />
              Create
            </button>

            {/* Create Dropdown */}
            <div
              className={`absolute right-0 top-full mt-3 w-56 origin-top-right rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ${createOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                }`}
            >
              <div className="mb-2 border-b border-white/5 px-3 pb-2">
                <p className="text-[0.65rem] font-medium uppercase tracking-widest text-amber-400/60">Log Your Experience</p>
              </div>

              <Link
                to="/diary"
                onClick={() => setCreateOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition-all duration-200 hover:bg-amber-400/10 hover:text-amber-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
                  <Book className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">Diary Entry</p>
                  <p className="text-[10px] text-slate-400">Log a film experience</p>
                </div>
              </Link>

                <div
                  role="button"
                  tabIndex={0}
                    onClick={() => {
                      setCreateOpen(false)
                      navigate("/me/lists?create=1")
                    }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      setCreateOpen(false)
                      navigate("/me/lists?create=1")
                    }
                  }}
                  className="mt-2 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition-all duration-200 hover:bg-amber-400/10 hover:text-amber-300"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
                    <ListPlus className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">List</p>
                    <p className="text-[10px] text-slate-400">Curate films your way</p>
                  </div>
                </div>

            </div>
          </div>
        )}


        {/* Auth/User Section */}
        <div className="hidden items-center gap-4 md:flex">
          {user ? (
            <>
              <NotificationsBell />
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="group flex cursor-pointer items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"
                >
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-xs font-semibold text-amber-300 ring-2 ring-amber-400/20 transition-all duration-300 group-hover:ring-amber-400/40">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name ?? user.email ?? "User avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(user.name, user.email)
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-white">{user.name ?? user.email}</p>
                    {user.username && (
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    )}
                  </div>
                  {/* Dropdown arrow */}
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-3 w-52 origin-top-right rounded-2xl border border-white/10 bg-[rgb(18,18,24)]/95 p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 ${menuOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
                    }`}
                >
                  <div className="mb-2 border-b border-white/5 px-3 pb-2">
                    <p className="text-[0.65rem] font-medium uppercase tracking-widest text-amber-400/60">Account</p>
                  </div>
                  <Link
                    to={user.username ? `/users/${user.username}` : "/"}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-200 transition-all duration-200 hover:bg-white/10 hover:text-white"
                  >
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <div className="my-2 border-t border-white/5" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      void handleLogout()
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-rose-300 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="btn-secondary text-sm"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="btn-primary text-sm"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {user && <NotificationsBell compact />}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-all duration-300 hover:border-amber-400/30 hover:bg-white/10"
            aria-label="Toggle navigation"
          >
            <div className="flex flex-col gap-1.5">
              <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "opacity-0" : ""}`} />
              <span className={`h-0.5 w-5 bg-current transition-all duration-300 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`overflow-hidden border-t border-white/5 transition-all duration-500 ease-out md:hidden ${open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <div className="px-6 py-6">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link, index) => (
              <NavLink
                key={link.label}
                to={link.href}
                style={{ animationDelay: `${index * 0.1}s` }}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                    ? "bg-amber-400/10 text-amber-400"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                  } ${open ? "animate-fade-up" : ""}`
                }
                onClick={(event) => {
                  if (!user && (link.href === "/watchlist" || link.href === "/activity")) {
                    event.preventDefault()
                    setOpen(false)
                    redirectToLogin()
                    return
                  }
                  setOpen(false)
                }}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/5 pt-6">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-xs font-semibold text-amber-300">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name ?? user.email ?? "User avatar"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(user.name, user.email)
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-white">{user.name ?? user.email}</p>
                    {user.username && (
                      <p className="text-xs text-slate-400">@{user.username}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to={user.username ? `/users/${user.username}` : "/"}
                    onClick={() => setOpen(false)}
                    className="btn-secondary w-full text-center text-sm"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      void handleLogout()
                    }}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-center text-sm font-medium text-rose-300 transition-all duration-200 hover:bg-rose-500/20"
                  >
                    Log out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="btn-secondary w-full text-center text-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  className="btn-primary w-full text-center text-sm"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  )
}
