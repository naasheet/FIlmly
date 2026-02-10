import { useMemo, useRef, useState } from "react"

type RatingStarsProps = {
  value: number
  onChange?: (next: number) => void
  max?: number
  step?: number
  readOnly?: boolean
  label?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundToStep(value: number, step: number) {
  const precision = step.toString().includes(".") ? step.toString().split(".")[1].length : 0
  const rounded = Math.round(value / step) * step
  return Number(rounded.toFixed(precision))
}

function Star({ fillPercent, size }: { fillPercent: number; size: keyof typeof sizeMap }) {
  return (
    <span className={`relative ${sizeMap[size]} shrink-0`}>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`absolute inset-0 ${sizeMap[size]} text-slate-600`}
        fill="currentColor"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${fillPercent}%` }}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`absolute inset-0 ${sizeMap[size]} text-amber-400`}
          fill="currentColor"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </span>
    </span>
  )
}

export default function RatingStars({
  value,
  onChange,
  max = 5,
  step = 0.5,
  readOnly = false,
  label = "Rating",
  size = "md",
}: RatingStarsProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const interactive = Boolean(onChange) && !readOnly
  const displayValue = hoverValue ?? value

  const fillPercents = useMemo(() => {
    return Array.from({ length: max }).map((_, index) => {
      const starValue = index + 1
      const raw = clamp(displayValue - (starValue - 1), 0, 1)
      return Math.round(raw * 100)
    })
  }, [displayValue, max])

  const computeValueFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return value
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1)
    const rawValue = ratio * max
    return roundToStep(rawValue, step)
  }

  const handlePointerMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return
    setHoverValue(computeValueFromPointer(event.clientX))
  }

  const handlePointerLeave = () => {
    if (!interactive) return
    setHoverValue(null)
  }

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return
    onChange(computeValueFromPointer(event.clientX))
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onChange) return
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault()
      onChange(clamp(roundToStep(value + step, step), 0, max))
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault()
      onChange(clamp(roundToStep(value - step, step), 0, max))
    }
    if (event.key === "Home") {
      event.preventDefault()
      onChange(0)
    }
    if (event.key === "End") {
      event.preventDefault()
      onChange(max)
    }
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={displayValue}
      aria-valuetext={`${displayValue} out of ${max}`}
      tabIndex={interactive ? 0 : -1}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-1 ${
        interactive ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {fillPercents.map((fillPercent, index) => (
        <Star key={`star-${index}`} fillPercent={fillPercent} size={size} />
      ))}
    </div>
  )
}
