-- AlterTable
ALTER TABLE "List" ADD COLUMN     "popularityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "trendingScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ListView" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListView_listId_idx" ON "ListView"("listId");

-- CreateIndex
CREATE INDEX "ListView_userId_idx" ON "ListView"("userId");

-- CreateIndex
CREATE INDEX "ListView_createdAt_idx" ON "ListView"("createdAt");

-- CreateIndex
CREATE INDEX "ListView_listId_createdAt_idx" ON "ListView"("listId", "createdAt");

-- CreateIndex
CREATE INDEX "ListView_userId_listId_idx" ON "ListView"("userId", "listId");

-- AddForeignKey
ALTER TABLE "ListView" ADD CONSTRAINT "ListView_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListView" ADD CONSTRAINT "ListView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
