-- CreateEnum
CREATE TYPE "ContributorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "ListContributor" ADD COLUMN     "status" "ContributorStatus" NOT NULL DEFAULT 'PENDING';
