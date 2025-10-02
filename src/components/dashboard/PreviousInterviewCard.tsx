import React from "react";

interface Interview {
  id: string;
  jobRole: string;
  experienceLevel: string;
  createdAt: string;
  overallScore: number;
  grade: string;
  totalQuestions: number;
  answeredQuestions: number;
  completionPercentage: number;
}

interface PreviousInterviewCardProps {
  interview: Interview;
  onReAttempt: () => void;
  onViewFeedback: () => void;
}

const PreviousInterviewCard: React.FC<PreviousInterviewCardProps> = ({
  interview,
  onReAttempt,
  onViewFeedback,
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return "No Date";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      // Use consistent formatting to avoid hydration mismatches
      const month = (date.getMonth() + 1).toString();
      const day = date.getDate().toString();
      const year = date.getFullYear().toString().slice(-2);

      return `${month}/${day}/${year}`;
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-blue-600 bg-blue-50";
    if (score >= 4) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getGradeColor = (grade: string) => {
    if (grade === "Excellent" || grade === "Very Good") return "text-green-700";
    if (grade === "Good" || grade === "Average") return "text-blue-700";
    return "text-red-700";
  };

  return (
    <div className="rounded-md border border-gray-100 shadow-sm w-[300px] p-3 m-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h1 className="font-bold text-lg text-gray-800 flex-1 mr-2">
          {interview.jobRole}
        </h1>
        <span className="text-sm text-gray-400 whitespace-nowrap">
          {formatDate(interview.createdAt)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="bg-gray-200 text-sm p-1 px-2 rounded-full">
          {interview.experienceLevel && interview.experienceLevel !== "0"
            ? `${interview.experienceLevel} year${
                interview.experienceLevel !== "1" ? "s" : ""
              } exp`
            : "Entry Level"}
        </div>
        <div
          className={`text-sm p-1 px-2 rounded-full font-medium ${getScoreColor(
            interview.overallScore
          )}`}
        >
          {interview.overallScore}/10
        </div>
      </div>

      <div className="mb-3">
        <div
          className={`text-sm font-medium ${getGradeColor(interview.grade)}`}
        >
          Grade: {interview.grade}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {interview.answeredQuestions}/{interview.totalQuestions} questions
          answered ({interview.completionPercentage}%)
        </div>
      </div>

      <div className="flex justify-between gap-2">
        <button
          onClick={onViewFeedback}
          className="bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2 text-sm font-medium transition-colors flex-1"
        >
          View Feedback
        </button>
        <button
          onClick={onReAttempt}
          className="bg-black hover:bg-gray-800 text-white rounded-md px-3 py-2 text-sm font-medium transition-colors flex-1"
        >
          Re-attempt
        </button>
      </div>
    </div>
  );
};

export default PreviousInterviewCard;
