/*
  Warnings:

  - Added the required column `file_name` to the `resumes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."resumes" ADD COLUMN     "file_name" TEXT NOT NULL,
ADD COLUMN     "file_path" TEXT,
ALTER COLUMN "parsed_data" DROP NOT NULL;
