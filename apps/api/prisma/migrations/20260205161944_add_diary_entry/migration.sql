-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "watchedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mood" TEXT,
    "rating" DOUBLE PRECISION,
    "location" TEXT,
    "venue" TEXT,
    "format" TEXT,
    "vibes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weather" TEXT,
    "companions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_idx" ON "DiaryEntry"("userId");

-- CreateIndex
CREATE INDEX "DiaryEntry_filmId_idx" ON "DiaryEntry"("filmId");

-- CreateIndex
CREATE INDEX "DiaryEntry_watchedDate_idx" ON "DiaryEntry"("watchedDate");

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiaryEntry" ADD CONSTRAINT "DiaryEntry_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;
