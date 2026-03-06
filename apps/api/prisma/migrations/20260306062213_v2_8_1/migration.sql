/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_filmId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_userId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_activityId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "Comment";
