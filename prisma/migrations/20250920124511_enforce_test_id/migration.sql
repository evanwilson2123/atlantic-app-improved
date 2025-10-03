/*
  Warnings:

  - Made the column `testId` on table `CMJTest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `testId` on table `SJTest` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."CMJTest" ALTER COLUMN "testId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."SJTest" ALTER COLUMN "testId" SET NOT NULL;
