import "dotenv/config"
import {
  getFilmDetails,
  getImageUrl,
  getPopularFilms,
  getSimilarFilms,
  getTrendingFilms,
  searchFilms,
} from "../services/tmdbService"

async function run() {
  const search = await searchFilms("Inception", 2010, 1)
  const first = search?.results?.[0]
  console.log("searchFilms", { total: search?.total_results, firstId: first?.id })

  if (!first?.id) {
    throw new Error("No search results to test details/similar calls.")
  }

  const details = await getFilmDetails(first.id)
  console.log("getFilmDetails", { id: details?.id, title: details?.title, cast: details?.credits?.cast?.length })

  const popular = await getPopularFilms(1)
  console.log("getPopularFilms", { total: popular?.total_results, firstId: popular?.results?.[0]?.id })

  const trending = await getTrendingFilms("day")
  console.log("getTrendingFilms", { total: trending?.total_results, firstId: trending?.results?.[0]?.id })

  const similar = await getSimilarFilms(first.id)
  console.log("getSimilarFilms", { total: similar?.total_results, firstId: similar?.results?.[0]?.id })

  const imageUrl = getImageUrl(first.poster_path, "w342")
  console.log("getImageUrl", { imageUrl })
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
