import { PrismaClient } from "@prisma/client"
import type { TMDBPersonMovieCredit } from "../types/tmdb"
import {
  getPersonCredits,
  getPersonDetails,
  getPersonExternalIds,
} from "./tmdbService"

const prisma = new PrismaClient()
const PERSON_STALE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

type OrganizedCredits = {
  acting: TMDBPersonMovieCredit[]
  directing: TMDBPersonMovieCredit[]
  writing: TMDBPersonMovieCredit[]
}

function isPersonStale(lastSyncedAt: Date | null) {
  if (!lastSyncedAt) return true
  return Date.now() - lastSyncedAt.getTime() > PERSON_STALE_WINDOW_MS
}

function toDate(value?: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function getReleaseDate(credit: { release_date?: string }) {
  if (!credit.release_date) return null
  const parsed = new Date(credit.release_date)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function sortByReleaseDateDesc<T extends { release_date?: string }>(credits: T[]) {
  return credits
    .slice()
    .sort((a, b) => {
      const aDate = getReleaseDate(a)?.getTime() ?? 0
      const bDate = getReleaseDate(b)?.getTime() ?? 0
      return bDate - aDate
    })
}

class PersonService {
  async getOrCreatePerson(personId: number) {
    const existing = await prisma.person.findUnique({ where: { id: personId } })
    if (!existing || isPersonStale(existing.lastSyncedAt)) {
      return this.syncPersonFromTMDB(personId)
    }
    return existing
  }

  async syncPersonFromTMDB(personId: number) {
    const [details, externalIds] = await Promise.all([
      getPersonDetails(personId),
      getPersonExternalIds(personId),
    ])

    return prisma.person.upsert({
      where: { id: personId },
      update: {
        name: details.name,
        biography: details.biography ?? null,
        birthday: toDate(details.birthday),
        deathday: toDate(details.deathday),
        placeOfBirth: details.place_of_birth ?? null,
        profilePath: details.profile_path ?? null,
        knownForDepartment: details.known_for_department ?? null,
        popularity: details.popularity ?? null,
        imdbId: externalIds.imdb_id ?? details.imdb_id ?? null,
        instagramId: externalIds.instagram_id ?? null,
        twitterId: externalIds.twitter_id ?? null,
        facebookId: externalIds.facebook_id ?? null,
        lastSyncedAt: new Date(),
      },
      create: {
        id: personId,
        name: details.name,
        biography: details.biography ?? null,
        birthday: toDate(details.birthday),
        deathday: toDate(details.deathday),
        placeOfBirth: details.place_of_birth ?? null,
        profilePath: details.profile_path ?? null,
        knownForDepartment: details.known_for_department ?? null,
        popularity: details.popularity ?? null,
        imdbId: externalIds.imdb_id ?? details.imdb_id ?? null,
        instagramId: externalIds.instagram_id ?? null,
        twitterId: externalIds.twitter_id ?? null,
        facebookId: externalIds.facebook_id ?? null,
        lastSyncedAt: new Date(),
      },
    })
  }

  async getPersonWithCredits(personId: number) {
    const person = await this.getOrCreatePerson(personId)
    const credits = await getPersonCredits(personId)

    const acting = sortByReleaseDateDesc(credits.cast).slice(0, 20)
    const directing = sortByReleaseDateDesc(
      credits.crew.filter((credit) => credit.department === "Directing"),
    ).slice(0, 20)
    const writing = sortByReleaseDateDesc(
      credits.crew.filter((credit) => credit.department === "Writing"),
    ).slice(0, 20)

    const organized: OrganizedCredits = {
      acting,
      directing,
      writing,
    }

    return {
      person,
      credits: organized,
    }
  }
}

export const personService = new PersonService()
