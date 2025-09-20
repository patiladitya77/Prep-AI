import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuestionsSections from "./QuestionsSections";
import RecordAnswerSection from "./RecordAnswerSection";

const interviewData = [
  {
    _id: "650a1f1a1a2b3c4d5e6f0001",
    sessionId: "750b2f2b2b3c4d5e6f7g0001",
    text: "Tell me about a project where you used React.",
    type: "technical",
    generatedFrom: "resume+jd",
    order: 1,
  },
  {
    _id: "650a1f1a1a2b3c4d5e6f0002",
    sessionId: "750b2f2b2b3c4d5e6f7g0001",
    text: "What challenges did you face while integrating an API in your previous projects?",
    type: "technical",
    generatedFrom: "resume",
    order: 2,
  },
  {
    _id: "650a1f1a1a2b3c4d5e6f0003",
    sessionId: "750b2f2b2b3c4d5e6f7g0001",
    text: "Why do you want to work for this company?",
    type: "behavioral",
    generatedFrom: "jd",
    order: 3,
  },
  {
    _id: "650a1f1a1a2b3c4d5e6f0004",
    sessionId: "750b2f2b2b3c4d5e6f7g0001",
    text: "Explain how you optimized performance in one of your web applications.",
    type: "technical",
    generatedFrom: "resume+jd",
    order: 4,
  },
  {
    _id: "650a1f1a1a2b3c4d5e6f0005",
    sessionId: "750b2f2b2b3c4d5e6f7g0001",
    text: "Where do you see yourself in the next 3 years?",
    type: "behavioral",
    generatedFrom: "generic",
    order: 5,
  },
];

const InterviewUI = ({ id }) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const totalQuestions = interviewData.length; // = 5
  const progressValue =
    totalQuestions === 0
      ? 0
      : ((activeQuestionIndex + 1) / totalQuestions) * 100;

  const handleSeeScore = () => {
    console.log("score");
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {"BackendDeveloper"}
        </h1>
        <p className="text-gray-600">{3} years experience level</p>
        <Progress value={progressValue} className="h-2 mt-4" />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>
            Question {activeQuestionIndex + 1} of {interviewData.length}
          </span>
          <span>{Math.round(progressValue)}% completed</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <QuestionsSections
          activeQuestionIndex={activeQuestionIndex}
          mockInterviewQuestion={interviewData}
          setActiveQuestionIndex={setActiveQuestionIndex}
        />

        <RecordAnswerSection
          activeQuestionIndex={activeQuestionIndex}
          mockInterviewQuestion={interviewData}
          //   interviewData={interviewData}
        />
      </div>

      <div className="flex justify-between mt-8 gap-4">
        <Button
          variant="outline"
          disabled={activeQuestionIndex === 0}
          onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
          className="gap-2"
        >
          <ChevronLeft size={18} />
          Previous
        </Button>

        {activeQuestionIndex < interviewData.length - 1 ? (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
            className="gap-2"
          >
            Next
            <ChevronRight size={18} />
          </Button>
        ) : (
          <div className="flex gap-4 w-full">
            {interviewData.length === 5 && (
              <Button
                variant="outline"
                onClick={handleSeeScore}
                className="gap-2 flex-1 bg-yellow-300 hover:bg-yellow-400"
              >
                See Score
              </Button>
            )}
            <Link href={`Home/dashboard/`} className="flex-1">
              <Button className="w-full bg-green-600 hover:bg-green-700 gap-2">
                Finish Interview
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Score Dialog */}
      {/* <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your Current Score</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-lg">
              Your average score is:{" "}
              <span className="font-bold">{averageScore.toFixed(1)}/10</span>
            </p>
            {averageScore < 4 && (
              <p className="text-red-500 mt-2">
                Consider reviewing feedback to improve your performance.
              </p>
            )}
          </div>
          <DialogFooter>
            {averageScore < 4 ? (
              <Link
                href={`/dashboard/interview/${interviewData?.mockId}/feedback`}
                className="w-full"
              >
                <Button className="w-full">See Feedback</Button>
              </Link>
            ) : (
              <Button
                onClick={() => {
                  setShowScoreDialog(false);
                  setShowContinueDialog(true);
                }}
                className="w-full"
              >
                Want to Continue?
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog> */}

      {/* Continue Dialog */}
      {/* <Dialog open={showContinueDialog} onOpenChange={setShowContinueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Continue Interview</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>How many additional questions would you like?</p>
            <Input
              type="number"
              min="1"
              max="10"
              value={additionalQuestionsCount}
              onChange={(e) =>
                setAdditionalQuestionsCount(
                  Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
            />
          </div>
          <DialogFooter className="gap-2">
            <Link
              href={`/dashboard/interview/${interviewData?.mockId}/feedback`}
            >
              <Button
                variant="outline"
                onClick={() => {
                  setShowContinueDialog(false);
                }}
              >
                No, Finish Now
              </Button>
            </Link>
            <Button
              onClick={() =>
                generateAdditionalQuestions(additionalQuestionsCount)
              }
              disabled={loadingAdditionalQuestions}
            >
              {loadingAdditionalQuestions ? "Generating..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default InterviewUI;
