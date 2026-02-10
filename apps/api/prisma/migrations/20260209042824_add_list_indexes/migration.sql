-- CreateIndex
CREATE INDEX "List_lastActivityAt_idx" ON "List"("lastActivityAt");

-- CreateIndex
CREATE INDEX "List_privacy_createdAt_idx" ON "List"("privacy", "createdAt");

-- CreateIndex
CREATE INDEX "ListContributor_listId_userId_idx" ON "ListContributor"("listId", "userId");

-- CreateIndex
CREATE INDEX "ListFilm_listId_rank_idx" ON "ListFilm"("listId", "rank");
