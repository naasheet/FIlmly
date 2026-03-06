-- Add expectation vs reality fields and remove diary rating
ALTER TABLE "DiaryEntry"
  DROP COLUMN "rating",
  ADD COLUMN "expectedRating" DOUBLE PRECISION,
  ADD COLUMN "expectedNote" TEXT,
  ADD COLUMN "actualRating" DOUBLE PRECISION,
  ADD COLUMN "actualNote" TEXT,
  ADD COLUMN "expectationWhy" TEXT;
