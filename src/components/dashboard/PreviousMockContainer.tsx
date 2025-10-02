"use client";
import React, { use, useEffect, useState } from "react";
import PreviousInterviewCard from "./PreviousInterviewCard";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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

const PreviousMockContainer = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCompletedInterviews();
  }, []);

  const fetchCompletedInterviews = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Please login to view your interview history");
        return;
      }

      const response = await fetch("/api/interview/completed", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setInterviews(data.data.interviews);
      } else {
        setError(data.error || "Failed to fetch interview history");
        toast.error("❌ Failed to load interview history");
      }
    } catch (error) {
      setError("Network error loading interviews");
      toast.error("❌ Network error loading interview history");
    } finally {
      setLoading(false);
    }
  };

  const handleReAttempt = async (interviewId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("❌ Please login to re-attempt interview");
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(
        "🔄 Creating new interview session..."
      );

      const response = await fetch("/api/interview/reattempt", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalSessionId: interviewId,
        }),
      });

      const data = await response.json();

      toast.dismiss(loadingToast);

      if (data.success) {
        toast.success("🎯 New interview session created! Redirecting...");
        // Redirect to the new interview session with active parameter
        router.push(`/interview/${data.sessionId}?session=active`);
      } else {
        toast.error(`❌ ${data.error || "Failed to re-attempt interview"}`);
      }
    } catch (error) {
      console.error("Error re-attempting interview:", error);
      toast.error("❌ Network error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-md w-full border border-gray-100 shadow-sm">
        <h1 className="font-semibold text-xl p-2 m-2">
          Previous Mock Interviews
        </h1>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">
            Loading your interview history...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-md w-full border border-gray-100 shadow-sm">
        <h1 className="font-semibold text-xl p-2 m-2">
          Previous Mock Interviews
        </h1>
        <div className="p-4 text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md w-full border border-gray-100 shadow-sm">
      <h1 className="font-semibold text-xl p-2 m-2">
        Previous Mock Interviews
        {interviews.length > 0 && (
          <span className="text-sm text-gray-500 ml-2">
            ({interviews.length} completed)
          </span>
        )}
      </h1>

      {interviews.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <p>No completed interviews yet.</p>
          <p className="text-sm mt-1">
            Start your first interview to see results here!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {interviews.map((interview) => (
            <PreviousInterviewCard
              key={interview.id}
              interview={interview}
              onReAttempt={() => {
                handleReAttempt(interview.id);
              }}
              onViewFeedback={() => {
                // Navigate to feedback page or open modal
                router.push(`/interview/${interview.id}/results`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PreviousMockContainer;
