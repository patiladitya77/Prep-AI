"use client";

import { use } from "react";
import InterviewUI from "@/components/interview/InterviewUI";
import PreInterview from "@/components/interview/PreInterviewNew";
import { useSearchParams } from "next/navigation";
import PreparingInterview from "@/components/interview/PreparingInterview";

export default function InterviewPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const status = searchParams.get("status");

  if (status === "preparing") {
    return <PreparingInterview sessionId={resolvedParams.interviewId} />;
  }

  if (status === "active") {
    return <InterviewUI sessionId={resolvedParams.interviewId} />;
  }

  return <PreInterview interviewId={resolvedParams.interviewId} />;
}
