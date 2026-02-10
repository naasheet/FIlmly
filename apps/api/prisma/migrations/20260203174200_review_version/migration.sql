-- CreateTable
CREATE TABLE "ReviewVersion" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewVersion_reviewId_idx" ON "ReviewVersion"("reviewId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_filmId_key" ON "Review"("userId", "filmId");

-- AddForeignKey
ALTER TABLE "ReviewVersion" ADD CONSTRAINT "ReviewVersion_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

