import { useEffect, useState } from "react"
import { X } from "lucide-react"

type FilmGalleryProps = {
  filmId: number
}

export default function FilmGallery({ filmId }: FilmGalleryProps) {
  const [images, setImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({})
  const [errorMap, setErrorMap] = useState<Record<string, boolean>>({})

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/films/${filmId}/images`)
      const data = await response.json()
      setImages(Array.isArray(data?.backdrops) ? data.backdrops : [])
    } catch {
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setImages([])
    setSelectedImage(null)
    setShowAll(false)
    setLoadedMap({})
    setErrorMap({})
    void fetchImages()
  }, [filmId])

  useEffect(() => {
    if (!selectedImage) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedImage(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedImage])

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Gallery</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`gallery-skeleton-${index}`}
              className="aspect-[16/9] w-full animate-pulse rounded-2xl border border-white/10 bg-slate-800/70"
            />
          ))}
        </div>
      </section>
    )
  }

  if (images.length === 0) {
    return null
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-semibold text-white">Photos</h2>
      <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 transition-all duration-300">
        {(showAll ? images : images.slice(0, 8)).map((src, index) => {
          const isLoaded = loadedMap[src]
          const hasError = errorMap[src]
          return (
          <button
            key={src}
            type="button"
            onClick={() => setSelectedImage(src)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 text-left transition hover:scale-[1.02] hover:border-white/30 hover:ring-2 hover:ring-white/20 focus:outline-none"
          >
            <div className="relative aspect-video w-full">
              {!hasError && (
                <img
                  src={`https://image.tmdb.org/t/p/w500${src}`}
                  alt={`Film still ${index + 1}`}
                  loading="lazy"
                  onLoad={() => {
                    setLoadedMap((prev) => ({ ...prev, [src]: true }))
                  }}
                  onError={() => {
                    setErrorMap((prev) => ({ ...prev, [src]: true }))
                  }}
                  className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                    isLoaded ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
              {!isLoaded && !hasError && (
                <div className="absolute inset-0 animate-pulse bg-slate-800/70" />
              )}
              {hasError && (
                <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-slate-500">
                  No image
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />
            </div>
          </button>
          )
        })}
      </div>

      {images.length > 8 && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition hover:text-indigo-200"
        >
          View all {images.length} photos
          <span aria-hidden="true">→</span>
        </button>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 transition"
          onClick={() => setSelectedImage(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={`https://image.tmdb.org/t/p/original${selectedImage}`}
            alt="Selected film still"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  )
}
