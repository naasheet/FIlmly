import { useEffect, useMemo, useState } from "react"
import { usePageTitle } from "../../hooks/usePageTitle"
import { Link, useNavigate, useParams } from "react-router-dom"
import api, { normalizeApiError } from "../../services/api"
import { useAuthStore } from "../../stores/authStore"
import UserStats from "../../components/user/UserStats"
import FollowButton from "../../components/user/FollowButton"
import FilmCard from "../../components/film/FilmCard"
import ListGrid from "../../components/lists/ListGrid"
import type { List } from "../../stores/listStore"
import DiaryEntry, { type DiaryEntryData } from "../../components/diary/DiaryEntry"
import Header from "../../components/layout/Header"

type UserProfile = {
  id: string
  email: string
  username: string
  name?: string | null
  bio?: string | null
  avatarUrl?: string | null
  coverImageUrl?: string | null
  location?: string | null
  website?: string | null
  instagram?: string | null
  twitter?: string | null
  createdAt?: string
}

type UserStats = {
  reviewCount: number
  ratingCount: number
  watchlistCount: number
  watchlistItemCount: number
  watchedCount: number
  averageRating: number | null
}

type UserReview = {
  id: string
  rating: number
  comment?: string | null
  film: { id: number; title: string; posterPath?: string | null }
  createdAt: string
}

type WatchedItem = {
  id: string
  watchedAt: string
  film: { id: number; title: string; posterPath?: string | null; releaseDate?: string | null }
}

type TabKey = "reviews" | "diary" | "lists" | "stats" | "watched"

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const authUser = useAuthStore((state) => state.user)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  usePageTitle(profile ? `@${profile.username}` : null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [watched, setWatched] = useState<WatchedItem[]>([])
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("reviews")
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followersList, setFollowersList] = useState<UserProfile[]>([])
  const [followingList, setFollowingList] = useState<UserProfile[]>([])
  const [followListOpen, setFollowListOpen] = useState<"followers" | "following" | null>(null)
  const [followListLoading, setFollowListLoading] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  const [listsLoaded, setListsLoaded] = useState(false)
  const [watchedLoaded, setWatchedLoaded] = useState(false)
  const [diaryLoaded, setDiaryLoaded] = useState(false)

  const visibleLists = useMemo(() => {
    if (isOwnProfile) return lists
    return lists.filter((list) => list.privacy === "PUBLIC")
  }, [lists, isOwnProfile])

  const sortedLists = useMemo(() => {
    return [...visibleLists].sort((a, b) => b.likeCount - a.likeCount)
  }, [visibleLists])

  const initials = useMemo(() => {
    const name = profile?.name ?? profile?.username ?? ""
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }, [profile?.name, profile?.username])

  useEffect(() => {
    let active = true

    setReviews([])
    setLists([])
    setWatched([])
    setDiaryEntries([])
    setReviewsLoaded(false)
    setListsLoaded(false)
    setWatchedLoaded(false)
    setDiaryLoaded(false)

    const fetchProfile = async () => {
      if (!username) {
        if (authUser?.username) {
          navigate(`/users/${authUser.username}`, { replace: true })
          return
        }
        setError("Username is required")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const profileRes = await api.get(`/users/${username}`)

        if (!active) return

        setProfile(profileRes.data as UserProfile)
        setIsOwnProfile(Boolean(authUser?.username && authUser.username === username))
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    fetchProfile()
    return () => {
      active = false
    }
  }, [username, authUser, navigate])

  useEffect(() => {
    let active = true
    if (!username) return
    const idle = (cb: () => void) => {
      if ("requestIdleCallback" in window) {
        ; (window as any).requestIdleCallback(cb)
      } else {
        setTimeout(cb, 0)
      }
    }
    idle(async () => {
      try {
        const [statsRes, followersRes, followingRes] = await Promise.allSettled([
          api.get(`/users/${username}/stats`),
          api.get(`/users/${username}/followers`),
          api.get(`/users/${username}/following`),
        ])
        if (!active) return
        if (statsRes.status === "fulfilled") {
          setStats(statsRes.value.data as UserStats)
        }
        if (followersRes.status === "fulfilled") {
          setFollowersCount(Number(followersRes.value.data?.count ?? 0))
        }
        if (followingRes.status === "fulfilled") {
          setFollowingCount(Number(followingRes.value.data?.count ?? 0))
        }
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      }
    })
    return () => {
      active = false
    }
  }, [username])

  useEffect(() => {
    let active = true
    if (!followListOpen || !username) return

    setFollowListLoading(true)
    const endpoint = followListOpen === "followers" ? "followers" : "following"
    api
      .get(`/users/${username}/${endpoint}`)
      .then((res) => {
        if (!active) return
        if (followListOpen === "followers") {
          const list = (res.data?.followers ?? [])
            .map((entry: any) => entry.follower)
            .filter(Boolean)
          setFollowersList(list)
        } else {
          const list = (res.data?.following ?? [])
            .map((entry: any) => entry.following)
            .filter(Boolean)
          setFollowingList(list)
        }
      })
      .catch(() => null)
      .finally(() => {
        if (active) setFollowListLoading(false)
      })

    return () => {
      active = false
    }
  }, [followListOpen, username])

  useEffect(() => {
    let active = true
    if (!username || isOwnProfile || !authUser) {
      setIsFollowing(false)
      return
    }
    const idle = (cb: () => void) => {
      if ("requestIdleCallback" in window) {
        ; (window as any).requestIdleCallback(cb)
      } else {
        setTimeout(cb, 0)
      }
    }
    idle(async () => {
      try {
        const res = await api.get(`/users/${username}/follow-status`)
        if (active) setIsFollowing(Boolean(res.data?.following))
      } catch {
        if (active) setIsFollowing(false)
      }
    })
    return () => {
      active = false
    }
  }, [username, isOwnProfile, authUser])

  useEffect(() => {
    let active = true
    if (!username) return
    if (activeTab === "reviews" && !reviewsLoaded) {
      api
        .get(`/users/${username}/reviews`)
        .then((res) => {
          if (active) {
            setReviews((res.data as UserReview[]) ?? [])
            setReviewsLoaded(true)
          }
        })
        .catch((err) => {
          if (active) setError(normalizeApiError(err))
        })
    }
    if (!listsLoaded) {
      api
        .get(`/users/${username}/lists`)
        .then((res) => {
          if (active) {
            const payload = res.data?.created ?? res.data
            const next = Array.isArray(payload) ? (payload as List[]) : []
            setLists(next)
            setListsLoaded(true)
          }
        })
        .catch((err) => {
          if (active) setError(normalizeApiError(err))
        })
    }
    if (activeTab === "watched" && !watchedLoaded) {
      api
        .get(`/users/${username}/watched`)
        .then((res) => {
          if (active) {
            setWatched((res.data as WatchedItem[]) ?? [])
            setWatchedLoaded(true)
          }
        })
        .catch((err) => {
          if (active) setError(normalizeApiError(err))
        })
    }
    if (activeTab === "diary" && !diaryLoaded) {
      api
        .get(`/users/${username}/diary`)
        .then((res) => {
          if (active) {
            const payload = res.data?.results ?? res.data?.entries ?? res.data
            setDiaryEntries(Array.isArray(payload) ? (payload as DiaryEntryData[]) : [])
            setDiaryLoaded(true)
          }
        })
        .catch((err) => {
          if (active) setError(normalizeApiError(err))
        })
    }
    return () => {
      active = false
    }
  }, [activeTab, username, reviewsLoaded, listsLoaded, watchedLoaded, diaryLoaded])

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-base text-slate-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-base text-rose-200">
            {error}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-base text-slate-400">Profile not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />

      <section className="bg-gradient-to-br from-[rgb(18,18,24)] via-[rgb(10,10,16)] to-transparent">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-slate-900/70">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name ?? profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-400">
                    {initials || "?"}
                  </div>
                )}
              </div>
              <div>
                <h1 className="font-['Outfit'] text-3xl font-semibold text-white">
                  {profile.name ?? profile.username}
                </h1>
                <p className="mt-1 text-base text-slate-400">@{profile.username}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-base text-slate-300">
                  <button
                    type="button"
                    onClick={() => setFollowListOpen("followers")}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-amber-200"
                  >
                    {followersCount}
                    <span className="font-normal text-slate-400">followers</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowListOpen("following")}
                    className="inline-flex items-center gap-1 font-semibold text-white hover:text-amber-200"
                  >
                    {followingCount}
                    <span className="font-normal text-slate-400">following</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={() => navigate("/settings")}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-base font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
                >
                  Edit profile
                </button>
              ) : (
                <FollowButton
                  initialFollowing={isFollowing}
                  onFollow={async () => {
                    await api.post(`/users/${username}/follow`)
                    setIsFollowing(true)
                    setFollowersCount((prev) => prev + 1)
                  }}
                  onUnfollow={async () => {
                    await api.delete(`/users/${username}/follow`)
                    setIsFollowing(false)
                    setFollowersCount((prev) => Math.max(0, prev - 1))
                  }}
                />
              )}
            </div>
          </div>
          {profile.bio && (
            <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300">
              {profile.bio}
            </p>
          )}

        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8">
        <div className="flex flex-wrap gap-4 border-b border-white/10 pb-3 text-base">
          {(["reviews", "diary", "watched", "lists", "stats"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 pb-2 text-base font-semibold transition ${activeTab === tab
                  ? "border-indigo-400 text-indigo-200"
                  : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
            >
              {tab === "reviews" && `Reviews (${reviews.length})`}
              {tab === "diary" && "Diary"}
              {tab === "watched" && "Watched"}
              {tab === "lists" && `Lists (${visibleLists.length})`}
              {tab === "stats" && "Stats"}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <Link
                key={review.id}
                to={`/films/${review.film.id}`}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/30 hover:bg-white/10"
              >
                <p className="text-base font-semibold text-white">{review.film.title}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Rated {review.rating} / 5
                </p>
                {review.comment && (
                  <p className="mt-2 text-sm text-slate-300 line-clamp-3">
                    {review.comment}
                  </p>
                )}
              </Link>
            ))}
            {reviews.length === 0 && (
              <p className="text-base text-slate-400">No reviews yet.</p>
            )}
          </div>
        )}

        {activeTab === "diary" && (
          <div className="mt-6 grid gap-4">
            {diaryEntries
              .filter((entry) => (isOwnProfile ? true : !entry.isPrivate))
              .map((entry) => (
                <DiaryEntry
                  key={entry.id}
                  entry={entry}
                  showFilmInfo
                  onOpen={isOwnProfile ? undefined : undefined}
                />
              ))}
            {!diaryLoaded && (
              <p className="text-base text-slate-400">Loading diary entries...</p>
            )}
            {diaryLoaded &&
              diaryEntries.filter((entry) => (isOwnProfile ? true : !entry.isPrivate)).length ===
              0 && (
                <p className="text-base text-slate-400">No public diary entries yet.</p>
              )}
          </div>
        )}

        {activeTab === "watched" && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {watched.map((item) => (
              <div key={item.id} className="space-y-2">
                <FilmCard
                  id={item.film.id}
                  title={item.film.title}
                  releaseDate={item.film.releaseDate}
                  posterPath={item.film.posterPath}
                  rating={null}
                  showRating={false}
                  showViewLabel={false}
                  watchedDateLabel={`Watched ${new Date(item.watchedAt).toLocaleDateString()}`}
                />
              </div>
            ))}
            {!watchedLoaded && (
              <p className="text-base text-slate-400">Loading watched films...</p>
            )}
            {watchedLoaded && watched.length === 0 && (
              <p className="text-base text-slate-400">No watched films yet.</p>
            )}
          </div>
        )}

        {activeTab === "lists" && (
          <div className="mt-6">
            {!listsLoaded && (
              <p className="text-base text-slate-400">Loading lists...</p>
            )}
            {listsLoaded && (
              <ListGrid
                lists={sortedLists}
                onCreate={isOwnProfile ? () => navigate("/me/lists") : undefined}
              />
            )}
          </div>
        )}

        {activeTab === "stats" && (
          <div className="mt-6 space-y-6">
            <UserStats
              filmsWatched={stats?.watchedCount ?? 0}
              reviewsWritten={stats?.reviewCount ?? 0}
              onFilmsClick={() => setActiveTab("watched")}
              onReviewsClick={() => setActiveTab("reviews")}
            />
          </div>
        )}
      </main>

      {followListOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setFollowListOpen(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[rgb(18,18,24)] p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {followListOpen === "followers" ? "Followers" : "Following"}
              </h3>
              <button
                type="button"
                onClick={() => setFollowListOpen(null)}
                className="rounded-full border border-white/10 p-2 text-white/60 transition hover:border-white/30 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {followListLoading && (
                <p className="text-sm text-slate-400">Loading list...</p>
              )}
              {!followListLoading &&
                (followListOpen === "followers" ? followersList : followingList).map((userItem) => (
                  <Link
                    key={userItem.id}
                    to={`/users/${userItem.username ?? userItem.id}`}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-white/30 hover:bg-white/10"
                    onClick={() => setFollowListOpen(null)}
                  >
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-white/10 bg-white/10">
                      {userItem.avatarUrl ? (
                        <img src={userItem.avatarUrl} alt={userItem.name ?? userItem.username} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                          {(userItem.name ?? userItem.username ?? "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {userItem.name ?? userItem.username ?? "User"}
                      </p>
                      <p className="truncate text-xs text-slate-400">@{userItem.username ?? "user"}</p>
                    </div>
                  </Link>
                ))}
              {!followListLoading &&
                (followListOpen === "followers" ? followersList : followingList).length === 0 && (
                  <p className="text-sm text-slate-400">No users yet.</p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
