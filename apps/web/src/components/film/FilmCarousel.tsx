import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FilmCarouselProps {
    title: string
    subtitle?: string
    children: React.ReactNode
    showArrows?: boolean
}

export default function FilmCarousel({
    title,
    subtitle,
    children,
    showArrows = true,
}: FilmCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)

    const checkScroll = () => {
        const el = scrollRef.current
        if (!el) return
        setCanScrollLeft(el.scrollLeft > 0)
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
    }

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        checkScroll()
        el.addEventListener("scroll", checkScroll)
        window.addEventListener("resize", checkScroll)
        return () => {
            el.removeEventListener("scroll", checkScroll)
            window.removeEventListener("resize", checkScroll)
        }
    }, [])

    const scroll = (direction: "left" | "right") => {
        const el = scrollRef.current
        if (!el) return
        const scrollAmount = el.clientWidth * 0.8
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        })
    }

    return (
        <section className="relative py-6">
            {/* Header */}
            <div className="mb-4 flex items-end justify-between px-8 lg:px-12">
                <div>
                    <h2 className="font-['Outfit'] text-xl font-semibold text-white md:text-2xl">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
                    )}
                </div>

                {/* Arrow Controls */}
                {showArrows && (
                    <div className="hidden items-center gap-2 md:flex">
                        <button
                            type="button"
                            onClick={() => scroll("left")}
                            disabled={!canScrollLeft}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${canScrollLeft
                                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                                    : "border-white/5 bg-white/5 text-white/20 cursor-not-allowed"
                                }`}
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scroll("right")}
                            disabled={!canScrollRight}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${canScrollRight
                                    ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                                    : "border-white/5 bg-white/5 text-white/20 cursor-not-allowed"
                                }`}
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Carousel Container */}
            <div className="relative">
                {/* Left fade */}
                <div
                    className={`pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-[rgb(8,8,12)] to-transparent transition-opacity duration-300 ${canScrollLeft ? "opacity-100" : "opacity-0"
                        }`}
                />

                {/* Scrollable area */}
                <div
                    ref={scrollRef}
                    className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth px-8 pb-4 lg:px-12"
                >
                    {children}
                </div>

                {/* Right fade */}
                <div
                    className={`pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-[rgb(8,8,12)] to-transparent transition-opacity duration-300 ${canScrollRight ? "opacity-100" : "opacity-0"
                        }`}
                />
            </div>
        </section>
    )
}
