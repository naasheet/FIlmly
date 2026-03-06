import { useEffect, useRef, useState } from "react"

export function useCountUp(target: number, durationMs = 700) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef(0)
  const fromRef = useRef(0)

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    startRef.current = performance.now()
    fromRef.current = value

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / durationMs)
      const next = Math.round(fromRef.current + (target - fromRef.current) * progress)
      setValue(next)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, durationMs])

  return value
}
