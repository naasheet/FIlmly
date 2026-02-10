import { Navigate, Route, Routes } from "react-router-dom"
import { lazy, Suspense } from "react"
import LoginPage from "./pages/auth/LoginPage"
import SignupPage from "./pages/auth/SignupPage"
import ProtectedRoute from "./components/ProtectedRoute"
import HomePage from "./pages/home/HomePage"
import SearchResultsPage from "./pages/search/SearchResultsPage"

const FilmPage = lazy(() => import("./pages/film/FilmPage"))
const PersonPage = lazy(() => import("./pages/person/PersonPage"))
const ProfilePage = lazy(() => import("./pages/user/ProfilePage"))
const SettingsPage = lazy(() => import("./pages/user/SettingsPage"))
const UserSearchPage = lazy(() => import("./pages/user/UserSearchPage"))
const WatchlistPage = lazy(() => import("./pages/watchlist/WatchlistPage"))
const ReviewsPage = lazy(() => import("./pages/reviews/ReviewsPage"))
const ActivityFeedPage = lazy(() => import("./pages/activity/ActivityFeedPage"))
const DiaryPage = lazy(() => import("./pages/diary/DiaryPage"))
const DiaryEntryPage = lazy(() => import("./pages/diary/DiaryEntryPage"))
const ListDetailPage = lazy(() => import("./pages/lists/ListDetailPage"))
const BrowseListsPage = lazy(() => import("./pages/lists/BrowseListsPage"))
const MyListsPage = lazy(() => import("./pages/lists/MyListsPage"))

const PageLoader = () => (
  <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
    <div className="mx-auto w-full max-w-6xl px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
        Loading...
      </div>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/" element={<HomePage />} />
      <Route
        path="/films/:id"
        element={
          <Suspense fallback={<PageLoader />}>
            <FilmPage />
          </Suspense>
        }
      />
      <Route
        path="/person/:id"
        element={
          <Suspense fallback={<PageLoader />}>
            <PersonPage />
          </Suspense>
        }
      />
      <Route
        path="/users/:username"
        element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        }
      />
      <Route
        path="/users/:username/diary"
        element={
          <Suspense fallback={<PageLoader />}>
            <DiaryPage />
          </Suspense>
        }
      />
      <Route
        path="/diary/:id"
        element={
          <Suspense fallback={<PageLoader />}>
            <DiaryEntryPage />
          </Suspense>
        }
      />
      <Route
        path="/users/search"
        element={
          <Suspense fallback={<PageLoader />}>
            <UserSearchPage />
          </Suspense>
        }
      />
      <Route
        path="/activity"
        element={
          <Suspense fallback={<PageLoader />}>
            <ActivityFeedPage />
          </Suspense>
        }
      />
      <Route
        path="/reviews"
        element={
          <Suspense fallback={<PageLoader />}>
            <ReviewsPage />
          </Suspense>
        }
      />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route
        path="/lists/:slug"
        element={
          <Suspense fallback={<PageLoader />}>
            <ListDetailPage />
          </Suspense>
        }
      />
      <Route
        path="/lists"
        element={
          <Suspense fallback={<PageLoader />}>
            <BrowseListsPage />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="/watchlist"
          element={
            <Suspense fallback={<PageLoader />}>
              <WatchlistPage />
            </Suspense>
          }
        />
        <Route
          path="/diary"
          element={
            <Suspense fallback={<PageLoader />}>
              <DiaryPage />
            </Suspense>
          }
        />
        <Route
          path="/me/lists"
          element={
            <Suspense fallback={<PageLoader />}>
              <MyListsPage />
            </Suspense>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
