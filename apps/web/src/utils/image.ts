export function resolvePosterUrl(posterPath: string | null | undefined, size: string) {
  if (!posterPath) {
    return null
  }

  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath
  }

  const normalized = posterPath.startsWith("/") ? posterPath : `/${posterPath}`
  return `https://image.tmdb.org/t/p/${size}${normalized}`
}
