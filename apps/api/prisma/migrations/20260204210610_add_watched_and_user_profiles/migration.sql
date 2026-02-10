-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "twitter" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "Watched" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Watched_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Watched_userId_idx" ON "Watched"("userId");

-- CreateIndex
CREATE INDEX "Watched_filmId_idx" ON "Watched"("filmId");

-- CreateIndex
CREATE UNIQUE INDEX "Watched_userId_filmId_key" ON "Watched"("userId", "filmId");

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Watched" ADD CONSTRAINT "Watched_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;
