-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hideReviews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "privateProfile" BOOLEAN NOT NULL DEFAULT false;
