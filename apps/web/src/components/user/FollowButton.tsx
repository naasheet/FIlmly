import { useEffect, useState } from "react"

type FollowButtonProps = {
  initialFollowing?: boolean
  onFollow?: () => Promise<void> | void
  onUnfollow?: () => Promise<void> | void
}

export default function FollowButton({
  initialFollowing = false,
  onFollow,
  onUnfollow,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setFollowing(initialFollowing)
  }, [initialFollowing])

  const handleClick = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (following) {
        await onUnfollow?.()
        setFollowing(false)
      } else {
        await onFollow?.()
        setFollowing(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`rounded-full px-4 py-2 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          following
            ? "border border-white/10 bg-white/5 text-white hover:border-white/30"
            : "bg-indigo-500 text-white hover:bg-indigo-400"
        }`}
      >
        {busy ? "Please wait..." : following ? "Unfollow" : "Follow"}
      </button>
    </div>
  )
}
