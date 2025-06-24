/*
  Warnings:

  - You are about to drop the column `end_data` on the `Trip` table. All the data in the column will be lost.
  - Added the required column `end_date` to the `Trip` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trip" DROP COLUMN "end_data",
ADD COLUMN     "end_date" TEXT NOT NULL;
