/*
  Warnings:

  - You are about to drop the column `end_date` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `Event` table. All the data in the column will be lost.
  - Added the required column `day_number` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "end_date",
DROP COLUMN "start_date",
ADD COLUMN     "day_number" INTEGER NOT NULL,
ADD COLUMN     "end_time" TEXT NOT NULL,
ADD COLUMN     "start_time" TEXT NOT NULL;
