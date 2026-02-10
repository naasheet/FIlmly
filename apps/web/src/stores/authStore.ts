import { create } from "zustand"
import { persist } from "zustand/middleware"

type AuthUser = {
  id: string
  email: string
  username?: string | null
  supabaseUserId?: string | null
  name?: string | null
  avatarUrl?: string | null
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isHydrated: boolean
  setAuth: (payload: {
    user: AuthUser
    accessToken: string
    refreshToken: string
  }) => void
  setHydrated: (hydrated: boolean) => void
  setUser: (user: AuthUser | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isHydrated: false,
      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "filmly-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true)
      },
    }
  )
)
