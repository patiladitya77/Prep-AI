import React from "react";
import InterviewSetup from "./InterviewSetup";

interface PreInterviewProps {
  interviewId?: string | number;
}

const PreInterview: React.FC<PreInterviewProps> = ({ interviewId = 123 }) => {
  return <InterviewSetup interviewId={String(interviewId)} />;
};

export default PreInterview;
