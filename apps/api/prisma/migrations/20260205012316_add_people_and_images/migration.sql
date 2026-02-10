-- AlterTable
ALTER TABLE "FilmCredit" ADD COLUMN     "character" TEXT,
ADD COLUMN     "creditType" TEXT NOT NULL,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "job" TEXT,
ADD COLUMN     "order" INTEGER,
ADD COLUMN     "personId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "biography" TEXT,
    "birthday" TIMESTAMP(3),
    "deathday" TIMESTAMP(3),
    "placeOfBirth" TEXT,
    "profilePath" TEXT,
    "knownForDepartment" TEXT,
    "popularity" DOUBLE PRECISION,
    "imdbId" TEXT,
    "instagramId" TEXT,
    "twitterId" TEXT,
    "facebookId" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE INDEX "FilmCredit_personId_idx" ON "FilmCredit"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "FilmCredit_personId_filmId_creditType_key" ON "FilmCredit"("personId", "filmId", "creditType");

-- AddForeignKey
ALTER TABLE "FilmCredit" ADD CONSTRAINT "FilmCredit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
