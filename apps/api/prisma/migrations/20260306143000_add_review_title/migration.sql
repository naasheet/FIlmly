-- Add review titles
ALTER TABLE "Review" ADD COLUMN "title" TEXT;
ALTER TABLE "ReviewVersion" ADD COLUMN "title" TEXT;
