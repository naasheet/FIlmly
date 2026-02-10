-- AlterEnum
BEGIN;
UPDATE "ListActivity" SET "activityType" = 'LIST_PUBLISHED' WHERE "activityType" = 'LIST_FORKED';
CREATE TYPE "ActivityType_new" AS ENUM ('LIST_CREATED', 'FILM_ADDED', 'FILM_REMOVED', 'FILM_REORDERED', 'TITLE_UPDATED', 'DESCRIPTION_UPDATED', 'CONTRIBUTOR_ADDED', 'CONTRIBUTOR_REMOVED', 'LIST_PUBLISHED');
ALTER TABLE "ListActivity" ALTER COLUMN "activityType" TYPE "ActivityType_new" USING ("activityType"::text::"ActivityType_new");
ALTER TYPE "ActivityType" RENAME TO "ActivityType_old";
ALTER TYPE "ActivityType_new" RENAME TO "ActivityType";
DROP TYPE "public"."ActivityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "List" DROP CONSTRAINT "List_forkedFrom_fkey";

-- DropIndex
DROP INDEX "List_forkedFrom_idx";

-- AlterTable
ALTER TABLE "List" DROP COLUMN "forkCount",
DROP COLUMN "forkedFrom";
