import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import {
    Home,
    Compass,
    Bookmark,
    PenLine,
    Settings,
    LogOut,
    Search,
    User,
    ChevronLeft,
} from "lucide-react"
import { useAuthStore } from "../../stores/authStore"

const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Discover", path: "/discover" },
    { icon: Bookmark, label: "Watchlist", path: "/watchlist" },
    { icon: PenLine, label: "Reviews", path: "/reviews" },
]

export default function Sidebar() {
    const location = useLocation()
    const user = useAuthStore((state) => state.user)
    const clearAuth = useAuthStore((state) => state.clearAuth)
    const [expanded, setExpanded] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    const handleLogout = () => {
        clearAuth()
        window.location.href = "/login"
    }

    return (
        <>
            {/* Sidebar */}
            <aside
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
                className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-white/5 bg-[rgb(12,12,16)]/95 backdrop-blur-xl transition-all duration-300 ease-out ${expanded ? "w-64" : "w-20"
                    }`}
            >
                {/* Logo */}
                <div className="flex h-20 items-center px-5">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgb(14,14,18)] p-1 shadow-lg shadow-black/40">
                            <img src="/assets/logo.png" alt="Filmly logo" className="h-full w-full object-contain" />
                        </div>
                        <span
                            className={`font-['Outfit'] text-xl font-bold text-white transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            Filmly
                        </span>
                    </Link>
                </div>

                {/* Search */}
                <div className="px-3">
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className={`flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-3 text-slate-400 transition-all duration-200 hover:border-white/10 hover:bg-white/10 ${expanded ? "" : "justify-center"
                            }`}
                    >
                        <Search className="h-5 w-5 shrink-0" />
                        {expanded && <span className="text-sm">Search films...</span>}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-6 flex-1 space-y-1 px-3">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 ${isActive
                                        ? "bg-amber-400/10 text-amber-400"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    } ${expanded ? "" : "justify-center"}`}
                            >
                                <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-amber-400" : ""}`} />
                                <span
                                    className={`text-sm font-medium transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0"
                                        }`}
                                >
                                    {item.label}
                                </span>
                                {isActive && expanded && (
                                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-white/5 p-3">
                    {user ? (
                        <div className="space-y-1">
                            <Link
                                to={`/user/${user.username || user.id}`}
                                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white ${expanded ? "" : "justify-center"
                                    }`}
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
                                    {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                                </div>
                                {expanded && (
                                    <div className="flex-1 overflow-hidden">
                                        <p className="truncate text-sm font-medium text-white">
                                            {user.name || user.username || "User"}
                                        </p>
                                        <p className="truncate text-xs text-slate-500">View profile</p>
                                    </div>
                                )}
                            </Link>

                            <Link
                                to="/settings"
                                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-all duration-200 hover:bg-white/5 hover:text-white ${expanded ? "" : "justify-center"
                                    }`}
                            >
                                <Settings className="h-4 w-4 shrink-0" />
                                <span className={`text-sm transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>
                                    Settings
                                </span>
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-400 ${expanded ? "" : "justify-center"
                                    }`}
                            >
                                <LogOut className="h-4 w-4 shrink-0" />
                                <span className={`text-sm transition-opacity duration-200 ${expanded ? "opacity-100" : "opacity-0 w-0"}`}>
                                    Log out
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Link
                                to="/login"
                                className={`flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-3 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:bg-amber-300 ${expanded ? "" : "w-10 h-10 p-0"
                                    }`}
                            >
                                {expanded ? "Sign in" : <User className="h-4 w-4" />}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Collapse Indicator */}
                <div className="absolute -right-3 top-1/2 -translate-y-1/2">
                    <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[rgb(18,18,24)] text-slate-400 transition-all duration-300 ${expanded ? "opacity-100" : "opacity-0"
                            }`}
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </div>
                </div>
            </aside>

            {/* Search Modal */}
            {searchOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 pt-[15vh] backdrop-blur-sm"
                    onClick={() => setSearchOpen(false)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-2 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 rounded-xl bg-white/5 px-4 py-3">
                            <Search className="h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search for films, actors, directors..."
                                className="flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
                                autoFocus
                            />
                            <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-400">
                                ESC
                            </kbd>
                        </div>

                        {searchQuery.length > 0 && (
                            <div className="mt-2 max-h-[50vh] overflow-y-auto p-2">
                                <p className="px-3 py-6 text-center text-sm text-slate-500">
                                    Start typing to search...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Spacer for main content */}
            <div className="w-20 shrink-0" />
        </>
    )
}
