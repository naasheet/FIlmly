import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { usePageTitle } from "../../hooks/usePageTitle"
import Header from "../../components/layout/Header"
import api, { normalizeApiError } from "../../services/api"
import { useAuthStore } from "../../stores/authStore"

type ProfileForm = {
  name: string
  username: string
  bio: string
  location: string
  website: string
}

export default function SettingsPage() {
  usePageTitle("Settings")
  const authUser = useAuthStore((state) => state.user)
  const setAuth = useAuthStore((state) => state.setAuth)
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const handleBack = () => window.history.back()
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    username: "",
    bio: "",
    location: "",
    website: "",
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get("/users/me")
        if (!active) return
        setForm({
          name: res.data?.name ?? "",
          username: res.data?.username ?? "",
          bio: res.data?.bio ?? "",
          location: res.data?.location ?? "",
          website: res.data?.website ?? "",
        })
      } catch (err) {
        if (!active) return
        setError(normalizeApiError(err))
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [authUser?.id])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const updated = await api.patch("/users/me", {
        name: form.name,
        username: form.username,
        bio: form.bio,
        location: form.location,
        website: form.website,
      })

      if (avatarFile) {
        const body = new FormData()
        body.append("avatar", avatarFile)
        await api.post("/users/me/avatar", body, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      if (accessToken && refreshToken && updated.data) {
        setAuth({
          user: updated.data,
          accessToken,
          refreshToken,
        })
      }

      setSuccess("Profile updated.")
    } catch (err) {
      setError(normalizeApiError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
        <Header />
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="text-base text-slate-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[rgb(8,8,12)] text-slate-200">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-base text-amber-300 hover:text-amber-200"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>
        <h1 className="font-['Outfit'] text-3xl font-semibold text-white">Profile Settings</h1>
        <p className="mt-2 text-base text-slate-400">
          Manage your profile and privacy preferences.
        </p>

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-base text-rose-200">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-base text-emerald-200">
            {success}
          </div>
        )}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Profile</h2>
            <div className="mt-6 grid gap-5">
              <label className="text-base text-slate-200">
                Username
                <input
                  type="text"
                  value={form.username}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="text-base text-slate-200">
                Display name
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="text-base text-slate-200">
                Bio
                <textarea
                  value={form.bio}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="text-base text-slate-200">
                Location
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, location: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </label>
              <label className="text-base text-slate-200">
                Website
                <input
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, website: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-base text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold text-white">Avatar</h2>
            <p className="mt-2 text-base text-slate-400">
              Upload a square image for best results.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
              className="mt-4 w-full text-base text-slate-300 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-500/20 file:px-4 file:py-2 file:text-base file:font-semibold file:text-indigo-200 hover:file:bg-indigo-500/30"
            />
          </div>
        </section>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </main>
    </div>
  )
}
