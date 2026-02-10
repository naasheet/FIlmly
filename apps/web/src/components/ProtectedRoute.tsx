import { Navigate, Outlet } from "react-router-dom"
import { useAuthStore } from "../stores/authStore"

type ProtectedRouteProps = {
  redirectTo?: string
}

export default function ProtectedRoute({
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const isAuthed = useAuthStore((state) => Boolean(state.accessToken))

  if (!isAuthed) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
