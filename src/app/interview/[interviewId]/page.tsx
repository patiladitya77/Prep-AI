"use client";
import InterviewUI from "@/components/InterviewUI";
import PreInterview from "@/components/PreInterview";
import { useSearchParams } from "next/navigation";

export default function InterviewPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const session = searchParams.get("session");

  if (session === "active") {
    return <InterviewUI interviewId={params.id} />;
  }

  return <PreInterview interviewId={params.id} />;
}
