-- Enforce non-null review titles
UPDATE "Review" SET "title" = '' WHERE "title" IS NULL;
UPDATE "ReviewVersion" SET "title" = '' WHERE "title" IS NULL;

ALTER TABLE "Review" ALTER COLUMN "title" SET NOT NULL;
ALTER TABLE "ReviewVersion" ALTER COLUMN "title" SET NOT NULL;
