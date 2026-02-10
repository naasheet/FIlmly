import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10)

  const users = await prisma.user.createMany({
    data: [
      {
        email: "admin@filmly.dev",
        username: "filmlyadmin",
        name: "Filmly Admin",
        passwordHash,
      },
      {
        email: "jane@filmly.dev",
        username: "janereviewer",
        name: "Jane Reviewer",
        passwordHash,
      },
      {
        email: "mike@filmly.dev",
        username: "mikecritic",
        name: "Mike Critic",
        passwordHash,
      },
    ],
    skipDuplicates: true,
  })

  const films = await prisma.film.createMany({
    data: [
      {
        id: 910001,
        title: "The Last Frame",
        originalTitle: "The Last Frame",
        overview: "A retired cinematographer is pulled into one final mystery.",
        posterPath: "/the-last-frame.jpg",
        backdropPath: "/the-last-frame-bg.jpg",
        releaseDate: new Date("2021-10-15"),
        runtime: 118,
        genres: ["Mystery", "Drama"],
        director: "Avery Quinn",
        cast: ["Mara Lyons", "Elias Park", "Nina Holt"],
        tmdbRating: 7.4,
        imdbId: "tt9100010",
        imdbRating: 7.2,
        lastSyncedAt: new Date(),
      },
      {
        id: 910002,
        title: "Midnight Reels",
        originalTitle: "Midnight Reels",
        overview: "A late-night screening reveals a town's forgotten history.",
        posterPath: "/midnight-reels.jpg",
        backdropPath: "/midnight-reels-bg.jpg",
        releaseDate: new Date("2022-06-03"),
        runtime: 104,
        genres: ["Drama", "Thriller"],
        director: "Sofia Ramirez",
        cast: ["Jonah Fields", "Priya Shah", "Caleb Hart"],
        tmdbRating: 7.1,
        imdbId: "tt9100020",
        imdbRating: 6.9,
        lastSyncedAt: new Date(),
      },
      {
        id: 910003,
        title: "Signal in the Static",
        originalTitle: "Signal in the Static",
        overview: "A sound engineer deciphers a message hidden in old film stock.",
        posterPath: "/signal-static.jpg",
        backdropPath: "/signal-static-bg.jpg",
        releaseDate: new Date("2023-02-21"),
        runtime: 112,
        genres: ["Sci-Fi", "Mystery"],
        director: "Kenji Sato",
        cast: ["Ari Blake", "Mina Cho", "Diego Reyes"],
        tmdbRating: 6.8,
        imdbId: "tt9100030",
        imdbRating: 6.6,
        lastSyncedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  await prisma.person.createMany({
    data: [
      {
        id: 525,
        name: "Christopher Nolan",
        biography:
          "British-American filmmaker known for cerebral, nonlinear storytelling and practical visual effects.",
        birthday: new Date("1970-07-30"),
        placeOfBirth: "London, England, UK",
        knownForDepartment: "Directing",
        popularity: 50.0,
        imdbId: "nm0634240",
        instagramId: null,
        twitterId: null,
        facebookId: null,
        lastSyncedAt: new Date(),
      },
      {
        id: 6193,
        name: "Leonardo DiCaprio",
        biography:
          "American actor and producer, known for work in biopics and period films.",
        birthday: new Date("1974-11-11"),
        placeOfBirth: "Los Angeles, California, USA",
        knownForDepartment: "Acting",
        popularity: 60.0,
        imdbId: "nm0000138",
        instagramId: null,
        twitterId: null,
        facebookId: null,
        lastSyncedAt: new Date(),
      },
      {
        id: 3896,
        name: "Hans Zimmer",
        biography:
          "German film score composer and record producer.",
        birthday: new Date("1957-09-12"),
        placeOfBirth: "Frankfurt, Germany",
        knownForDepartment: "Sound",
        popularity: 20.0,
        imdbId: "nm0001877",
        instagramId: null,
        twitterId: null,
        facebookId: null,
        lastSyncedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  })

  const [admin, jane, mike] = await prisma.user.findMany({
    where: {
      email: { in: ["admin@filmly.dev", "jane@filmly.dev", "mike@filmly.dev"] },
    },
  })

  const [lastFrame, midnightReels, signalStatic] = await prisma.film.findMany({
    where: {
      title: {
        in: ["The Last Frame", "Midnight Reels", "Signal in the Static"],
      },
    },
  })

  const inception = await prisma.film.findFirst({
    where: { title: "Inception" },
  })

  const creditFilm = inception ?? lastFrame ?? midnightReels ?? signalStatic

  if (creditFilm) {
    await prisma.filmCredit.createMany({
      data: [
        {
          filmId: creditFilm.id,
          personId: 525,
          creditType: "crew",
          department: "Directing",
          job: "Director",
        },
        {
          filmId: creditFilm.id,
          personId: 6193,
          creditType: "cast",
          department: "Acting",
          character: "Cobb",
          order: 1,
        },
        {
          filmId: creditFilm.id,
          personId: 3896,
          creditType: "crew",
          department: "Sound",
          job: "Original Music Composer",
        },
      ],
      skipDuplicates: true,
    })
  }

  if (admin && jane && mike && lastFrame && midnightReels && signalStatic) {
    await prisma.review.createMany({
      data: [
        {
          userId: admin.id,
          filmId: lastFrame.id,
          rating: 5,
          comment: "A gorgeous finale with a haunting score.",
        },
        {
          userId: jane.id,
          filmId: midnightReels.id,
          rating: 4,
          comment: "Moody and atmospheric, with a clever third act.",
        },
        {
          userId: mike.id,
          filmId: signalStatic.id,
          rating: 3.5,
          comment: "Inventive concept, but the pacing drifts.",
        },
      ],
      skipDuplicates: true,
    })
  }

  return { users, films }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
