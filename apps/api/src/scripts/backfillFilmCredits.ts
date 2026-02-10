import { PrismaClient } from "@prisma/client"
import { getFilmCredits } from "../services/tmdbService"

const prisma = new PrismaClient()

async function syncCredits(filmId: number) {
  const credits = await getFilmCredits(filmId)
  const cast = credits?.cast ?? []
  const crew = credits?.crew ?? []

  if (cast.length === 0 && crew.length === 0) {
    return
  }

  await prisma.person.createMany({
    data: [
      ...cast.map((member) => ({ id: member.id, name: member.name })),
      ...crew.map((member) => ({ id: member.id, name: member.name })),
    ],
    skipDuplicates: true,
  })

  const creditRows = [
    ...cast.map((member) => ({
      filmId,
      personId: member.id,
      creditType: "cast",
      department: "Acting",
      job: null,
      character: member.character ?? null,
      order: member.order ?? null,
    })),
    ...crew.map((member) => ({
      filmId,
      personId: member.id,
      creditType: "crew",
      department: member.department ?? null,
      job: member.job ?? null,
      character: null,
      order: null,
    })),
  ]

  if (creditRows.length > 0) {
    await prisma.filmCredit.createMany({
      data: creditRows,
      skipDuplicates: true,
    })
  }
}

async function main() {
  const rows = await prisma.listFilm.findMany({
    distinct: ["filmId"],
    select: { filmId: true },
  })
  const filmIds = rows.map((row) => row.filmId)

  let processed = 0
  for (const filmId of filmIds) {
    try {
      await syncCredits(filmId)
      processed += 1
      if (processed % 10 === 0) {
        console.log(`Synced credits for ${processed}/${filmIds.length} films`)
      }
    } catch (err) {
      console.warn(`Failed for film ${filmId}:`, err)
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
