-- CreateTable
CREATE TABLE "ListSave" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListSave_listId_idx" ON "ListSave"("listId");

-- CreateIndex
CREATE INDEX "ListSave_userId_idx" ON "ListSave"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListSave_listId_userId_key" ON "ListSave"("listId", "userId");

-- AddForeignKey
ALTER TABLE "ListSave" ADD CONSTRAINT "ListSave_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListSave" ADD CONSTRAINT "ListSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
