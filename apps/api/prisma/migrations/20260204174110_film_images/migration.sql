-- AlterTable
ALTER TABLE "Film" ADD COLUMN     "backdrops" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imagesSyncedAt" TIMESTAMP(3),
ADD COLUMN     "logos" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "FilmCredit" (
    "id" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FilmCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FilmCredit_filmId_idx" ON "FilmCredit"("filmId");

-- AddForeignKey
ALTER TABLE "FilmCredit" ADD CONSTRAINT "FilmCredit_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;
