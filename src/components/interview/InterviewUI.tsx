import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import QuestionsSections from "./QuestionsSections";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useInterviewMonitoring } from "@/hooks/useInterviewMonitoring";
import InterviewMonitoringDisplay from "./InterviewMonitoringDisplay";

// Dynamically import RecordAnswerSection with no SSR to prevent window undefined errors
const RecordAnswerSection = dynamic(() => import("./RecordAnswerSection"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-600">Loading recording interface...</div>
    </div>
  ),
});

interface Question {
  id: string;
  questionText: string;
  order: number;
  createdAt: string;
}

interface InterviewUIProps {
  sessionId: string;
}

const InterviewUI: React.FC<InterviewUIProps> = ({ sessionId }) => {
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [overallScore, setOverallScore] = useState<number>(0);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [fallbackMode, setFallbackMode] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [finalResults, setFinalResults] = useState<any>(null);
  const [interviewTerminated, setInterviewTerminated] =
    useState<boolean>(false);
  const [monitoringStarted, setMonitoringStarted] = useState<boolean>(false);
  const router = useRouter();

  // Interview monitoring
  const {
    warningCount,
    isMonitoring,
    detectionStatus,
    videoRef,
    canvasRef,
    startCameraMonitoring,
    stopCameraMonitoring,
  } = useInterviewMonitoring({
    onWarning: (type, count) => {
      // Log warning to session (you might want to save this to database)
      console.log(`Warning ${count}: ${type}`);
      // Show a less intrusive warning
      if (count === 3) {
        toast.error("🚨 Final warning! Interview will be terminated.", {
          duration: 5000,
        });
      } else {
        toast.error(
          `⚠️ Warning ${count}/3: Please follow interview guidelines.`,
          { duration: 4000 }
        );
      }
    },
    onInterviewTerminated: () => {
      setInterviewTerminated(true);
      // End interview session
      handleInterviewTermination();
    },
    maxWarnings: 3,
    enabled: !showResults && !error && !interviewTerminated, // Remove loading condition
  });

  const handleInterviewTermination = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Mark interview as terminated in database
      await fetch("/api/interview/terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          reason: "Multiple monitoring violations",
          warningCount,
        }),
      });

      // Redirect to dashboard with message
      setTimeout(() => {
        router.push("/home/dashboard?message=interview_terminated");
      }, 3000);
    } catch (error) {
      console.error("Error terminating interview:", error);
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response = await fetch(
          `/api/interview/questions?sessionId=${sessionId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        if (data.success) {
          setQuestions(data.questions);
          setSessionData(data.session);

          // Check if we're using fallback mode
          if (data.fallbackMode) {
            setFallbackMode(true);
            toast("Using demo questions - database temporarily unavailable", {
              icon: "📝",
              duration: 6000,
            });
          }

          // Start monitoring after questions are loaded (only once)
          if (!monitoringStarted) {
            setMonitoringStarted(true);
            setTimeout(() => {
              startCameraMonitoring();
            }, 2000);
          }
        } else {
          setError(data.error || "Failed to fetch questions");
        }
      } catch (error) {
        toast.error("❌ Failed to load interview questions");
        setError("Failed to load interview questions");
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchQuestions();
    }

    // Cleanup monitoring on unmount
    return () => {
      stopCameraMonitoring();
    };
  }, [
    sessionId,
    startCameraMonitoring,
    stopCameraMonitoring,
    monitoringStarted,
  ]);

  // Convert questions to the format expected by existing components
  const interviewData = questions.map((question, index) => ({
    _id: question.id,
    sessionId: sessionId,
    text: question.questionText,
    type: "mixed", // Since we don't store type in current schema
    generatedFrom: "jd",
    order: question.order,
  }));
  const totalQuestions = interviewData.length;
  const progressValue =
    totalQuestions === 0
      ? 0
      : ((activeQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerSubmitted = (answerData: {
    questionId: string;
    answer: string;
  }) => {
    // Store the answer data (no individual scoring)
    setAnswers((prev) => ({
      ...prev,
      [answerData.questionId]: answerData,
    }));

    // Update completion percentage
    const answeredCount = Object.keys(answers).length + 1;
    const completion = (answeredCount / totalQuestions) * 100;
    setCompletionPercentage(completion);

    // Show success toast - answer saved
    toast.success(`✅ Answer saved for Question ${activeQuestionIndex + 1}`, {
      duration: 3000,
    });

    // If this is the last question, show completion notification
    if (answeredCount === totalQuestions) {
      setTimeout(() => {
        toast(
          `🎉 All questions answered! Click "See Final Score" to evaluate all answers and view complete results.`,
          {
            icon: "✨",
            duration: 8000,
          }
        );
      }, 1500);
    }
  };

  const fetchOverallScore = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(
        `/api/interview/score?sessionId=${sessionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setOverallScore(data.data.overallScore);
        setCompletionPercentage(data.data.completion);
        setFallbackMode(data.data.fallbackMode || false);
      }
    } catch (error) {
      console.error("Error fetching score:", error);
      // If fetch fails, we're probably in fallback mode
      setFallbackMode(true);
    }
  };

  const handleSeeScore = async () => {
    // Finish interview and get final results
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("❌ Please login to view results");
        return;
      }

      toast.loading("📊 Calculating your final score...", {
        id: "final-score",
      });

      const response = await fetch("/api/interview/finish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setFinalResults(data.data);
        setOverallScore(data.data.overallScore);
        setCompletionPercentage(data.data.completionPercentage);
        setShowResults(true);

        toast.success(
          `🎯 Interview completed! Final score: ${data.data.overallScore}/10 (${data.data.grade})`,
          { id: "final-score", duration: 5000 }
        );
      } else {
        toast.error(`❌ ${data.message || "Failed to calculate final score"}`, {
          id: "final-score",
        });
      }
    } catch (error) {
      toast.error("❌ Network error calculating final score", {
        id: "final-score",
      });
    }
  };

  // Show results if interview is completed
  if (showResults && finalResults) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            🎉 Interview Complete!
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {finalResults.overallScore}/10
            </div>
            <div className="text-xl text-blue-800 font-semibold mb-2">
              {finalResults.grade}
            </div>
            <div className="text-blue-700">
              {finalResults.answeredQuestions}/{finalResults.totalQuestions}{" "}
              questions answered ({finalResults.completionPercentage}% complete)
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Overall Feedback
            </h3>
            <p className="text-gray-700">{finalResults.overallFeedback}</p>
          </div>
        </div>

        {/* Individual Question Results */}
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-semibold text-gray-800">
            Question-by-Question Results
          </h2>
          {finalResults.questionResults.map((result: any, index: number) => (
            <div
              key={result.questionId}
              className="bg-white border rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-800">
                  Question {index + 1}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      result.score >= 8
                        ? "bg-green-100 text-green-800"
                        : result.score >= 7
                        ? "bg-blue-100 text-blue-800"
                        : result.score >= 6
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {result.score}/10
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-2">
                {result.questionText}
              </p>
              <div className="bg-gray-50 rounded p-3 mb-2">
                <p className="text-gray-700 text-sm">{result.answer}</p>
              </div>
              <p className="text-gray-600 text-sm">{result.feedback}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button onClick={() => setShowResults(false)} variant="outline">
            Back to Interview
          </Button>
          <Link href="/home/dashboard">
            <Button className="bg-green-600 hover:bg-green-700">
              Return to Dashboard
            </Button>
          </Link>
        </div>

        {finalResults.fallbackMode && (
          <div className="mt-6 p-3 bg-orange-100 border border-orange-300 rounded-lg text-center">
            <p className="text-orange-800 text-sm">
              ⚠️ Results calculated in demo mode - database temporarily
              unavailable
            </p>
          </div>
        )}
      </div>
    );
  }

  // Show termination screen if interview was terminated
  if (interviewTerminated) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🚨</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">
              Interview Terminated
            </h1>
            <p className="text-gray-600 mb-4">
              The interview has been terminated due to multiple monitoring
              violations.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Total warnings: {warningCount}/3
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading interview questions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">
            No questions available for this interview session.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      {/* Hidden monitoring elements */}
      <div className="hidden">
        <video ref={videoRef} autoPlay muted playsInline className="w-1 h-1" />
        <canvas ref={canvasRef} className="w-1 h-1" />
      </div>

      {/* Interview Monitoring Display */}
      <InterviewMonitoringDisplay
        warningCount={warningCount}
        maxWarnings={3}
        isMonitoring={isMonitoring}
        detectionStatus={detectionStatus}
      />

      {/* Fallback Mode Banner */}
      {fallbackMode && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-orange-600">⚠️</span>
            <span className="text-orange-800 font-medium">
              Demo Mode Active
            </span>
          </div>
          <p className="text-orange-700 text-sm mt-1">
            Using demo questions and temporary storage. Your responses are saved
            for this session only.
          </p>
        </div>
      )}

      <div className="mb-6 md:mr-74">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-800">
            AI-Generated Interview Session {fallbackMode && "(Demo Mode)"}
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 text-black border rounded hover:bg-gray-50 cursor-pointer transition-colors"
          >
            ← Back to Dashboard
          </button>
        </div>

        <p className="text-gray-600">
          {fallbackMode
            ? "Using demo questions - database temporarily unavailable"
            : "Questions generated from job description"}
        </p>
        <Progress value={progressValue} className="h-2 mt-2" />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>
            Question {activeQuestionIndex + 1} of {interviewData.length}
          </span>
          <span>{Math.round(progressValue)}% completed</span>
        </div>

        {/* Progress Display */}
        {completionPercentage > 0 && (
          <div
            className={`mt-4 p-4 border rounded-lg ${
              fallbackMode
                ? "bg-orange-50 border-orange-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex justify-between items-center text-sm mb-2">
              <span
                className={`font-medium ${
                  fallbackMode ? "text-orange-700" : "text-blue-700"
                }`}
              >
                Interview Progress{fallbackMode ? " (Temporary Storage)" : ""}:
              </span>
              <div className="flex gap-4">
                <span
                  className={fallbackMode ? "text-orange-600" : "text-blue-600"}
                >
                  Answered: {Object.keys(answers).length}/{totalQuestions}
                </span>
                <span
                  className={fallbackMode ? "text-orange-600" : "text-blue-600"}
                >
                  {completionPercentage.toFixed(0)}% Complete
                </span>
              </div>
            </div>

            {/* Individual Question Status */}
            {Object.keys(answers).length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-gray-600 mb-2">
                  Question Status:
                </div>
                <div className="flex flex-wrap gap-2">
                  {interviewData.map((question, index) => {
                    const answer = answers[question._id];
                    const isCurrentQuestion = index === activeQuestionIndex;
                    return (
                      <div
                        key={question._id}
                        className={`px-2 py-1 rounded text-xs font-medium border-2 transition-all ${
                          isCurrentQuestion
                            ? "border-blue-500 bg-blue-100 text-blue-800 ring-2 ring-blue-200"
                            : answer
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        Q{index + 1}: {answer ? "✅" : "—"}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {fallbackMode && (
              <div className="mt-2 text-xs text-orange-600">
                📝 Database unavailable - using temporary storage for this
                session
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <QuestionsSections
          activeQuestionIndex={activeQuestionIndex}
          setActiveQuestionIndex={setActiveQuestionIndex}
          mockInterviewQuestion={interviewData}
        />

        <RecordAnswerSection
          activeQuestionIndex={activeQuestionIndex}
          mockInterviewQuestion={interviewData}
          sessionId={sessionId}
          onAnswerSubmitted={handleAnswerSubmitted}
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
          <div className="flex gap-4">
            <Button
              onClick={handleSeeScore}
              className="bg-green-600 hover:bg-green-700 gap-2 flex-1"
              disabled={Object.keys(answers).length === 0}
            >
              {Object.keys(answers).length === 0
                ? "Answer Questions First"
                : `See Final Score (${
                    Object.keys(answers).length
                  }/${totalQuestions} answered)`}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (Object.keys(answers).length > 0) {
                  const confirmExit = confirm(
                    `You have answered ${
                      Object.keys(answers).length
                    }/${totalQuestions} questions. Are you sure you want to exit without seeing your complete results?`
                  );
                  if (confirmExit) {
                    window.location.href = "/home/dashboard";
                  }
                } else {
                  window.location.href = "/home/dashboard";
                }
              }}
              className="gap-2"
            >
              Exit Interview
            </Button>
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
