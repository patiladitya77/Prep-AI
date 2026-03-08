import { Worker } from "bullmq";
import IORedis from "ioredis";
import generateInterviewQuestions from "../../../services/questionGeneration";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

console.log("🚀 Question Worker Started...");

export const worker = new Worker(
  "question-generation",
  async (job) => {
    console.log("⚙ Job received:", job.id);

    const { sessionId, jobDescription, expYears, jobRole, userId } = job.data;

    return await generateInterviewQuestions(
      sessionId,
      jobDescription,
      expYears,
      jobRole,
      userId,
    );
  },
  {
    connection,
  },
);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});
