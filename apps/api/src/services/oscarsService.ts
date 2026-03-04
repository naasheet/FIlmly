import fs from "fs"
import path from "path"

type OscarEntry = {
  category: string
  year: string
  won: boolean
  nominee_name: string
}

let oscarsData: Record<string, OscarEntry[]> | null = null

const CANDIDATES = [
  path.resolve(__dirname, "..", "..", "oscars_fast_lookup.json"),       // apps/api/oscars_fast_lookup.json (Vercel)
  path.resolve(process.cwd(), "oscars_fast_lookup.json"),              // apps/api/oscars_fast_lookup.json (local cwd)
  path.resolve(process.cwd(), "..", "..", "oscars_fast_lookup.json"),   // repo root (legacy local)
]

function loadOscarsData() {
  if (oscarsData) return oscarsData
  for (const candidate of CANDIDATES) {
    try {
      const raw = fs.readFileSync(candidate, "utf-8")
      oscarsData = JSON.parse(raw) as Record<string, OscarEntry[]>
      return oscarsData
    } catch {
      // try next candidate
    }
  }
  oscarsData = {}
  return oscarsData
}

export function getOscarsByFilmId(filmId: number) {
  const data = loadOscarsData()
  return data[String(filmId)] ?? []
}
