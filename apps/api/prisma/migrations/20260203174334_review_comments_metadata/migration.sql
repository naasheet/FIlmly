-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "containsSpoilers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rewatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watchedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ReviewVersion" ADD COLUMN     "containsSpoilers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rewatch" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "watchedDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewComment_reviewId_idx" ON "ReviewComment"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewComment_userId_idx" ON "ReviewComment"("userId");

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
