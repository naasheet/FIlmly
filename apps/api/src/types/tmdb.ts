export type TMDBTimeWindow = "day" | "week"

export type TMDBPaginatedResponse<T> = {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export type TMDBMovieSummary = {
  id: number
  title: string
  original_title?: string
  overview?: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  genre_ids?: number[]
  popularity?: number
}

export type TMDBCastMember = {
  id: number
  name: string
  character?: string
  profile_path?: string | null
  order?: number
}

export type TMDBCrewMember = {
  id: number
  name: string
  job?: string
  department?: string
  profile_path?: string | null
}

export type TMDBCredits = {
  cast: TMDBCastMember[]
  crew: TMDBCrewMember[]
}

export type TMDBImage = {
  file_path: string
  width?: number
  height?: number
  aspect_ratio?: number
  vote_average?: number
  vote_count?: number
  iso_639_1?: string | null
}

export type TMDBImages = {
  backdrops: TMDBImage[]
  posters: TMDBImage[]
  logos: TMDBImage[]
}

export type TMDBPersonDetails = {
  id: number
  name: string
  biography?: string
  birthday?: string | null
  deathday?: string | null
  place_of_birth?: string | null
  profile_path?: string | null
  known_for_department?: string | null
  popularity?: number | null
  imdb_id?: string | null
}

export type TMDBPersonSummary = {
  id: number
  name: string
  profile_path?: string | null
  known_for_department?: string | null
  popularity?: number | null
}

export type TMDBPersonExternalIds = {
  id: number
  imdb_id?: string | null
  instagram_id?: string | null
  twitter_id?: string | null
  facebook_id?: string | null
}

export type TMDBPersonMovieCredit = {
  id: number
  title: string
  original_title?: string
  overview?: string
  release_date?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  popularity?: number
  character?: string
  order?: number
  department?: string
  job?: string
}

export type TMDBPersonMovieCredits = {
  id: number
  cast: TMDBPersonMovieCredit[]
  crew: TMDBPersonMovieCredit[]
}

export type TMDBPersonImage = {
  file_path: string
  width?: number
  height?: number
  aspect_ratio?: number
  iso_639_1?: string | null
  vote_average?: number
  vote_count?: number
}

export type TMDBPersonImages = {
  id: number
  profiles: TMDBPersonImage[]
}

export type TMDBMovieDetails = {
  id: number
  title: string
  original_title?: string
  overview?: string
  release_date?: string
  runtime?: number | null
  status?: string
  tagline?: string
  poster_path?: string | null
  backdrop_path?: string | null
  vote_average?: number
  vote_count?: number
  imdb_id?: string | null
  genres?: { id: number; name: string }[]
  production_companies?: { id: number; name: string; logo_path?: string | null; origin_country?: string }[]
  credits?: TMDBCredits
}
