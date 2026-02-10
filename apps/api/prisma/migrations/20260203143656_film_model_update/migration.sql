/*
  Warnings:

  - The primary key for the `Film` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Film` table. All the data in the column will be lost.
  - Changed the type of `id` on the `Film` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `filmId` on the `Review` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_filmId_fkey";

-- AlterTable
ALTER TABLE "Film" DROP CONSTRAINT "Film_pkey",
DROP COLUMN "description",
ADD COLUMN     "backdropPath" TEXT,
ADD COLUMN     "cast" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "director" TEXT,
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "imdbId" TEXT,
ADD COLUMN     "imdbRating" DOUBLE PRECISION,
ADD COLUMN     "lastSyncedAt" TIMESTAMP(3),
ADD COLUMN     "originalTitle" TEXT,
ADD COLUMN     "overview" TEXT,
ADD COLUMN     "posterPath" TEXT,
ADD COLUMN     "runtime" INTEGER,
ADD COLUMN     "tmdbRating" DOUBLE PRECISION,
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "Film_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "filmId",
ADD COLUMN     "filmId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Film_title_idx" ON "Film"("title");

-- CreateIndex
CREATE INDEX "Film_releaseDate_idx" ON "Film"("releaseDate");

-- CreateIndex
CREATE INDEX "Film_imdbId_idx" ON "Film"("imdbId");

-- CreateIndex
CREATE INDEX "Film_tmdbRating_idx" ON "Film"("tmdbRating");

-- CreateIndex
CREATE INDEX "Review_filmId_idx" ON "Review"("filmId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;
