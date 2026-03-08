// /lib/queue/queue.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const questionQueue = new Queue("question-generation", {
  connection,
});
