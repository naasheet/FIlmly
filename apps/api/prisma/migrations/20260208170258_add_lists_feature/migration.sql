-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('PERSONAL', 'COLLABORATIVE', 'TEMPLATE');

-- CreateEnum
CREATE TYPE "ListPrivacy" AS ENUM ('PUBLIC', 'UNLISTED', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ContributorRole" AS ENUM ('OWNER', 'EDITOR', 'CONTRIBUTOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIST_CREATED', 'FILM_ADDED', 'FILM_REMOVED', 'FILM_REORDERED', 'TITLE_UPDATED', 'DESCRIPTION_UPDATED', 'CONTRIBUTOR_ADDED', 'CONTRIBUTOR_REMOVED', 'LIST_PUBLISHED', 'LIST_FORKED');

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "listType" "ListType" NOT NULL,
    "privacy" "ListPrivacy" NOT NULL,
    "isRanked" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "filmCount" INTEGER NOT NULL DEFAULT 0,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "collaboratorCount" INTEGER NOT NULL DEFAULT 0,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "coverImagePath" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActivityAt" TIMESTAMP(3),
    "forkedFrom" TEXT,

    CONSTRAINT "List_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListFilm" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "filmId" INTEGER NOT NULL,
    "rank" INTEGER,
    "notes" TEXT,
    "addedBy" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListFilm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListContributor" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ContributorRole" NOT NULL,
    "invitedBy" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListContributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListLike" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListActivity" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "activityType" "ActivityType" NOT NULL,
    "filmId" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "List_slug_key" ON "List"("slug");

-- CreateIndex
CREATE INDEX "List_userId_idx" ON "List"("userId");

-- CreateIndex
CREATE INDEX "List_slug_idx" ON "List"("slug");

-- CreateIndex
CREATE INDEX "List_privacy_idx" ON "List"("privacy");

-- CreateIndex
CREATE INDEX "List_listType_idx" ON "List"("listType");

-- CreateIndex
CREATE INDEX "List_likeCount_idx" ON "List"("likeCount");

-- CreateIndex
CREATE INDEX "List_createdAt_idx" ON "List"("createdAt");

-- CreateIndex
CREATE INDEX "List_forkedFrom_idx" ON "List"("forkedFrom");

-- CreateIndex
CREATE INDEX "ListFilm_listId_idx" ON "ListFilm"("listId");

-- CreateIndex
CREATE INDEX "ListFilm_filmId_idx" ON "ListFilm"("filmId");

-- CreateIndex
CREATE INDEX "ListFilm_rank_idx" ON "ListFilm"("rank");

-- CreateIndex
CREATE UNIQUE INDEX "ListFilm_listId_filmId_key" ON "ListFilm"("listId", "filmId");

-- CreateIndex
CREATE INDEX "ListContributor_listId_idx" ON "ListContributor"("listId");

-- CreateIndex
CREATE INDEX "ListContributor_userId_idx" ON "ListContributor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListContributor_listId_userId_key" ON "ListContributor"("listId", "userId");

-- CreateIndex
CREATE INDEX "ListLike_listId_idx" ON "ListLike"("listId");

-- CreateIndex
CREATE INDEX "ListLike_userId_idx" ON "ListLike"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ListLike_listId_userId_key" ON "ListLike"("listId", "userId");

-- CreateIndex
CREATE INDEX "ListActivity_listId_idx" ON "ListActivity"("listId");

-- CreateIndex
CREATE INDEX "ListActivity_userId_idx" ON "ListActivity"("userId");

-- CreateIndex
CREATE INDEX "ListActivity_createdAt_idx" ON "ListActivity"("createdAt");

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "List" ADD CONSTRAINT "List_forkedFrom_fkey" FOREIGN KEY ("forkedFrom") REFERENCES "List"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListFilm" ADD CONSTRAINT "ListFilm_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListFilm" ADD CONSTRAINT "ListFilm_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListFilm" ADD CONSTRAINT "ListFilm_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListContributor" ADD CONSTRAINT "ListContributor_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListContributor" ADD CONSTRAINT "ListContributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListContributor" ADD CONSTRAINT "ListContributor_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListLike" ADD CONSTRAINT "ListLike_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListLike" ADD CONSTRAINT "ListLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListActivity" ADD CONSTRAINT "ListActivity_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListActivity" ADD CONSTRAINT "ListActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListActivity" ADD CONSTRAINT "ListActivity_filmId_fkey" FOREIGN KEY ("filmId") REFERENCES "Film"("id") ON DELETE SET NULL ON UPDATE CASCADE;
