-- CreateEnum
CREATE TYPE "public"."GoalCategory" AS ENUM ('INTERVIEW', 'LEARNING', 'PRACTICE', 'RESUME');

-- AlterTable
ALTER TABLE "public"."answers" ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "improvements" JSONB,
ADD COLUMN     "score" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "strengths" JSONB;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "reset_token" TEXT,
ADD COLUMN     "reset_token_expiry" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."resume_analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "analysis_type" TEXT NOT NULL,
    "overall_score" DOUBLE PRECISION NOT NULL,
    "detailed_scores" JSONB,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "suggestions" JSONB,
    "extracted_text" TEXT,
    "job_description" TEXT,
    "analysis_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resume_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "public"."GoalCategory" NOT NULL DEFAULT 'INTERVIEW',
    "target_date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."resume_analyses" ADD CONSTRAINT "resume_analyses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."goals" ADD CONSTRAINT "goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
