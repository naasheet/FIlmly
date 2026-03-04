import { useEffect } from "react"

const DEFAULT_TITLE = "Filmly | Curate Your Cinema"

export function usePageTitle(title?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} — Filmly` : DEFAULT_TITLE
    }, [title])
}
