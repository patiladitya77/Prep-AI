"use client";

import { Progress } from "@/components/ui/progress";

type UsageProgressProps = {
  interviewsUsed: number;
  interviewLimit: number;
  resumeChecksUsed: number;
  resumeCheckLimit: number;
};

export default function UsageProgress({
  interviewsUsed,
  interviewLimit,
  resumeChecksUsed,
  resumeCheckLimit,
}: UsageProgressProps) {
  const interviewProgress = (interviewsUsed / interviewLimit) * 100;
  const resumeCheckProgress = (resumeChecksUsed / resumeCheckLimit) * 100;

  return (
    <div className="space-y-6 ">
      {/* Interview Progress */}
      <div>
        <p className="text-sm font-medium mb-1">
          Interviews: {interviewsUsed} / {interviewLimit}
        </p>
        <Progress value={interviewProgress} />
      </div>

      {/* Resume Check Progress */}
      <div>
        <p className="text-sm font-medium mb-1 whitespace-nowrap">
          Resume Checks: {resumeChecksUsed} / {resumeCheckLimit}
        </p>
        <Progress value={resumeCheckProgress} />
      </div>
    </div>
  );
}
