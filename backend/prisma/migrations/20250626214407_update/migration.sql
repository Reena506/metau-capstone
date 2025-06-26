/*
  Warnings:

  - Made the column `userId` on table `Event` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Expense` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Note` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Trip` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Note" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "userId" SET NOT NULL;
