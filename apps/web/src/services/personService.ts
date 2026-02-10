import api, { normalizeApiError } from "./api"

export type Person = {
  id: number
  name: string
  biography?: string | null
  birthday?: string | null
  deathday?: string | null
  placeOfBirth?: string | null
  profilePath?: string | null
  knownForDepartment?: string | null
  popularity?: number | null
  imdbId?: string | null
  instagramId?: string | null
  twitterId?: string | null
  facebookId?: string | null
  lastSyncedAt?: string | null
}

export type PersonCredit = {
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

export type PersonCredits = {
  acting: PersonCredit[]
  directing: PersonCredit[]
  writing: PersonCredit[]
}

export type PersonCreditsRaw = {
  cast: PersonCredit[]
  crew: PersonCredit[]
  id: number
}

export type PersonImages = {
  id: number
  profiles: {
    file_path: string
    width?: number
    height?: number
    aspect_ratio?: number
    iso_639_1?: string | null
    vote_average?: number
    vote_count?: number
  }[]
}

export type PersonDetailsResponse = {
  person: Person
  credits: PersonCredits
}

export const personService = {
  async getPersonDetails(personId: number): Promise<PersonDetailsResponse> {
    try {
      const response = await api.get(`/people/${personId}`)
      return response.data as PersonDetailsResponse
    } catch (error) {
      throw new Error(normalizeApiError(error))
    }
  },

  async getPersonCredits(personId: number): Promise<PersonCreditsRaw> {
    try {
      const response = await api.get(`/people/${personId}/credits`)
      return response.data as PersonCreditsRaw
    } catch (error) {
      throw new Error(normalizeApiError(error))
    }
  },

  async getPersonImages(personId: number): Promise<PersonImages> {
    try {
      const response = await api.get(`/people/${personId}/images`)
      return response.data as PersonImages
    } catch (error) {
      throw new Error(normalizeApiError(error))
    }
  },
}
