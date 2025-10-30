"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PageLoading,
  CardLoading,
  InlineLoading,
} from "@/components/ui/Loading";

interface AnalyticsData {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  recentInterviews: Array<{
    id: string;
    score: number;
    startedAt: string;
    status: string;
    jdData?: any;
  }>;
  skillsAnalysis: Array<{
    skill: string;
    averageScore: number;
    count: number;
  }>;
  monthlyProgress: Array<{
    month: string;
    interviews: number;
    averageScore: number;
  }>;
  resumeAnalytics: {
    totalResumes: number;
    averageResumeScore: number;
    recentResumes: Array<{
      id: string;
      fileName: string;
      createdAt: string;
      score: number | null;
      skills: string[];
      strengths: string[];
      weaknesses: string[];
      suggestions: string[];
    }>;
    resumeSkillsAnalysis: Array<{
      skill: string;
      count: number;
      averageScore: number;
    }>;
  };
}

export default function Analytics() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch("/api/analytics", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/home/dashboard");
  };

  if (isLoading || loading) {
    return <PageLoading text="Loading analytics..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Analytics</h1>
          <p>
            No analytics data available. Start taking interviews to see your
            progress!
          </p>
          <Button onClick={handleBackToDashboard} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreProgress = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Track your interview performance and progress
          </p>
        </div>
        <Button onClick={handleBackToDashboard} variant="outline">
          ← Back to Dashboard
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Interviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalInterviews}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.completedInterviews}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Interview Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getScoreColor(
                analytics.averageScore
              )}`}
            >
              {analytics.averageScore.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalInterviews > 0
                ? (
                    (analytics.completedInterviews /
                      analytics.totalInterviews) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analytics.resumeAnalytics?.totalResumes || 0}
            </div>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resume Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getScoreColor(
                analytics.resumeAnalytics?.averageResumeScore || 0
              )}`}
            >
              {(analytics.resumeAnalytics?.averageResumeScore || 0) > 0
                ? (analytics.resumeAnalytics?.averageResumeScore || 0).toFixed(
                    1
                  ) + "%"
                : "N/A"}
            </div>
          </CardContent>
        </Card> */}
      </div>

      {/* Recent Interviews and Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.recentInterviews || []).length > 0 ? (
                analytics.recentInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {interview.jdData?.jobRole || "Interview Session"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(interview.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${getScoreColor(
                          interview.score || 0
                        )}`}
                      >
                        {interview.score?.toFixed(1) || "N/A"}%
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          interview.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : interview.status === "ACTIVE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {interview.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No interviews completed yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skills Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Skills Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.skillsAnalysis || []).length > 0 ? (
                (analytics.skillsAnalysis || []).map((skill) => (
                  <div key={skill.skill} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{skill.skill}</span>
                      <span
                        className={`font-bold ${getScoreColor(
                          skill.averageScore
                        )}`}
                      >
                        {skill.averageScore.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getScoreProgress(
                          skill.averageScore
                        )}`}
                        style={{ width: `${skill.averageScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {skill.count} questions answered
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No skills data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Resumes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.resumeAnalytics?.recentResumes || []).length > 0 ? (
                (analytics.resumeAnalytics?.recentResumes || []).map(
                  (resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between p-3 bg-purple-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium truncate max-w-48">
                          {resume.fileName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(resume.skills || []).length} skills identified
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${getScoreColor(
                            resume.score || 0
                          )}`}
                        >
                          {resume.score
                            ? resume.score.toFixed(1) + "%"
                            : "Not scored"}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-24">
                          {(resume.skills || [])
                            .slice(0, 2)
                            .map((skill, index) => (
                              <span
                                key={index}
                                className="inline-block px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          {(resume.skills || []).length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{(resume.skills || []).length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No resumes uploaded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resume Skills Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Skills Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.resumeAnalytics?.resumeSkillsAnalysis || []).length >
              0 ? (
                (analytics.resumeAnalytics?.resumeSkillsAnalysis || []).map(
                  (skill) => (
                    <div key={skill.skill} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{skill.skill}</span>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">
                            {skill.count} resumes
                          </span>
                          {skill.averageScore > 0 && (
                            <span
                              className={`ml-2 font-bold ${getScoreColor(
                                skill.averageScore
                              )}`}
                            >
                              {skill.averageScore.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-purple-500"
                          style={{
                            width: `${Math.min(
                              (skill.count /
                                analytics.resumeAnalytics.totalResumes) *
                                100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )
                )
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No resume skills data available yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resume Detailed Analysis */}
      {(analytics.resumeAnalytics?.recentResumes || []).length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resume Analysis Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Strengths */}
              <div>
                <h3 className="font-semibold text-green-700 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Common Strengths
                </h3>
                <div className="space-y-2">
                  {(analytics.resumeAnalytics?.recentResumes || [])
                    .flatMap((resume) => resume.strengths || [])
                    .filter(
                      (strength, index, array) =>
                        array.indexOf(strength) === index
                    )
                    .slice(0, 5)
                    .map((strength, index) => (
                      <div
                        key={index}
                        className="p-2 bg-green-50 border-l-4 border-green-400 rounded"
                      >
                        <p className="text-sm text-green-800">{strength}</p>
                      </div>
                    ))}
                  {(analytics.resumeAnalytics?.recentResumes || []).every(
                    (resume) => (resume.strengths || []).length === 0
                  ) && (
                    <p className="text-gray-500 text-sm">
                      No strengths data available
                    </p>
                  )}
                </div>
              </div>

              {/* Weaknesses */}
              <div>
                <h3 className="font-semibold text-red-700 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Areas to Improve
                </h3>
                <div className="space-y-2">
                  {(analytics.resumeAnalytics?.recentResumes || [])
                    .flatMap((resume) => resume.weaknesses || [])
                    .filter(
                      (weakness, index, array) =>
                        array.indexOf(weakness) === index
                    )
                    .slice(0, 5)
                    .map((weakness, index) => (
                      <div
                        key={index}
                        className="p-2 bg-red-50 border-l-4 border-red-400 rounded"
                      >
                        <p className="text-sm text-red-800">{weakness}</p>
                      </div>
                    ))}
                  {(analytics.resumeAnalytics?.recentResumes || []).every(
                    (resume) => (resume.weaknesses || []).length === 0
                  ) && (
                    <p className="text-gray-500 text-sm">
                      No weaknesses data available
                    </p>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h3 className="font-semibold text-blue-700 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Suggestions
                </h3>
                <div className="space-y-2">
                  {(analytics.resumeAnalytics?.recentResumes || [])
                    .flatMap((resume) => resume.suggestions || [])
                    .filter(
                      (suggestion, index, array) =>
                        array.indexOf(suggestion) === index
                    )
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <div
                        key={index}
                        className="p-2 bg-blue-50 border-l-4 border-blue-400 rounded"
                      >
                        <p className="text-sm text-blue-800">{suggestion}</p>
                      </div>
                    ))}
                  {analytics.resumeAnalytics.recentResumes.every(
                    (resume) => (resume.suggestions || []).length === 0
                  ) && (
                    <p className="text-gray-500 text-sm">
                      No suggestions data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analytics.monthlyProgress || []).length > 0 ? (
              (analytics.monthlyProgress || []).map((month) => (
                <div
                  key={month.month}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{month.month}</p>
                    <p className="text-sm text-gray-600">
                      {month.interviews} interviews
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${getScoreColor(
                        month.averageScore
                      )}`}
                    >
                      {month.averageScore.toFixed(1)}% avg
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">
                No monthly data available yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Interview Recommendations */}
            {(analytics.averageScore || 0) < 60 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 font-medium">
                  Focus on improving your interview skills
                </p>
                <p className="text-red-600 text-sm">
                  Your average interview score is below 60%. Consider practicing
                  more frequently.
                </p>
              </div>
            )}
            {(analytics.totalInterviews || 0) < 5 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Take more practice interviews
                </p>
                <p className="text-blue-600 text-sm">
                  Complete more interviews to get better insights and improve
                  your skills.
                </p>
              </div>
            )}
            {analytics.averageScore >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  Great job on interviews!
                </p>
                <p className="text-green-600 text-sm">
                  You're performing excellently in interviews. Keep up the good
                  work!
                </p>
              </div>
            )}

            {/* Resume Recommendations */}
            {(analytics.resumeAnalytics?.totalResumes || 0) === 0 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-purple-800 font-medium">
                  Upload your resume for analysis
                </p>
                <p className="text-purple-600 text-sm">
                  Get detailed feedback on your resume to improve your job
                  applications.
                </p>
              </div>
            )}
            {(analytics.resumeAnalytics?.averageResumeScore || 0) > 0 &&
              (analytics.resumeAnalytics?.averageResumeScore || 0) < 70 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 font-medium">
                    Improve your resume quality
                  </p>
                  <p className="text-orange-600 text-sm">
                    Your average resume score is{" "}
                    {(
                      analytics.resumeAnalytics?.averageResumeScore || 0
                    ).toFixed(1)}
                    %. Review the suggestions above to enhance your resume.
                  </p>
                </div>
              )}
            {(analytics.resumeAnalytics?.averageResumeScore || 0) >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  Excellent resume quality!
                </p>
                <p className="text-green-600 text-sm">
                  Your resumes are scoring{" "}
                  {(analytics.resumeAnalytics?.averageResumeScore || 0).toFixed(
                    1
                  )}
                  % on average. Great work!
                </p>
              </div>
            )}
            {(analytics.resumeAnalytics?.totalResumes || 0) > 0 &&
              (analytics.resumeAnalytics?.totalResumes || 0) < 3 && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <p className="text-indigo-800 font-medium">
                    Create role-specific resumes
                  </p>
                  <p className="text-indigo-600 text-sm">
                    Consider creating different versions of your resume tailored
                    to different job roles.
                  </p>
                </div>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
