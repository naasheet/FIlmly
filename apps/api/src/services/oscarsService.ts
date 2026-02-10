import fs from "fs"
import path from "path"

type OscarEntry = {
  category: string
  year: string
  won: boolean
  nominee_name: string
}

let oscarsData: Record<string, OscarEntry[]> | null = null

function loadOscarsData() {
  if (oscarsData) return oscarsData
  try {
    const filePath = path.resolve(process.cwd(), "..", "..", "oscars_fast_lookup.json")
    const raw = fs.readFileSync(filePath, "utf-8")
    oscarsData = JSON.parse(raw) as Record<string, OscarEntry[]>
  } catch {
    oscarsData = {}
  }
  return oscarsData
}

export function getOscarsByFilmId(filmId: number) {
  const data = loadOscarsData()
  return data[String(filmId)] ?? []
}
