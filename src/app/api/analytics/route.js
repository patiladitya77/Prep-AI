import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Fetch user's interview sessions with related data
    const interviewSessions = await prisma.interviewSession.findMany({
      where: { userId: userId },
      include: {
        answers: true,
        questions: true,
        jd: true,
        resume: true,
      },
      orderBy: { startedAt: "desc" },
    });

    // Fetch user's resumes for resume analytics from ResumeAnalysis table
    const resumeAnalyses = await prisma.resumeAnalysis.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate analytics
    const totalInterviews = interviewSessions.length;
    const completedInterviews = interviewSessions.filter(
      (session) => session.status === "COMPLETED"
    ).length;

    // Calculate average score
    const completedSessionsWithScores = interviewSessions.filter(
      (session) => session.status === "COMPLETED" && session.score !== null
    );
    const averageScore =
      completedSessionsWithScores.length > 0
        ? completedSessionsWithScores.reduce(
            (sum, session) => sum + (session.score || 0),
            0
          ) / completedSessionsWithScores.length
        : 0;

    // Recent interviews (last 10)
    const recentInterviews = interviewSessions.slice(0, 10).map((session) => ({
      id: session.id,
      score: session.score,
      startedAt: session.startedAt,
      status: session.status,
      jdData: session.jd?.parsedData,
    }));

    // Skills analysis - extract skills from answers and calculate performance
    const skillsMap = new Map();

    interviewSessions.forEach((session) => {
      if (session.jd?.parsedData?.skills) {
        const skills = Array.isArray(session.jd.parsedData.skills)
          ? session.jd.parsedData.skills
          : [];

        skills.forEach((skill) => {
          if (!skillsMap.has(skill)) {
            skillsMap.set(skill, { scores: [], count: 0 });
          }

          // Add session score for this skill
          if (session.score !== null) {
            skillsMap.get(skill).scores.push(session.score);
          }
          skillsMap.get(skill).count += 1;
        });
      }
    });

    const skillsAnalysis = Array.from(skillsMap.entries())
      .map(([skill, data]) => ({
        skill,
        averageScore:
          data.scores.length > 0
            ? data.scores.reduce((sum, score) => sum + score, 0) /
              data.scores.length
            : 0,
        count: data.count,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    // Monthly progress - group by month
    const monthlyMap = new Map();
    const now = new Date();

    interviewSessions.forEach((session) => {
      const sessionDate = new Date(session.startedAt);
      const monthKey = `${sessionDate.getFullYear()}-${String(
        sessionDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = sessionDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          interviews: 0,
          scores: [],
        });
      }

      monthlyMap.get(monthKey).interviews += 1;
      if (session.score !== null) {
        monthlyMap.get(monthKey).scores.push(session.score);
      }
    });

    const monthlyProgress = Array.from(monthlyMap.entries())
      .map(([key, data]) => ({
        month: data.month,
        interviews: data.interviews,
        averageScore:
          data.scores.length > 0
            ? data.scores.reduce((sum, score) => sum + score, 0) /
              data.scores.length
            : 0,
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 6);

    // Resume Analytics from ResumeAnalysis table
    const totalResumeAnalyses = resumeAnalyses.length;
    const resumeAnalytics = resumeAnalyses.map((analysis) => {
      // Parse detailed scores if it's a JSON string
      let detailedScores = {};
      try {
        detailedScores =
          typeof analysis.detailedScores === "string"
            ? JSON.parse(analysis.detailedScores)
            : analysis.detailedScores || {};
      } catch (e) {
        detailedScores = {};
      }

      // Parse arrays if they're JSON strings
      let strengths = [];
      let weaknesses = [];
      let suggestions = [];

      try {
        strengths =
          typeof analysis.strengths === "string"
            ? JSON.parse(analysis.strengths)
            : analysis.strengths || [];
        weaknesses =
          typeof analysis.weaknesses === "string"
            ? JSON.parse(analysis.weaknesses)
            : analysis.weaknesses || [];
        suggestions =
          typeof analysis.suggestions === "string"
            ? JSON.parse(analysis.suggestions)
            : analysis.suggestions || [];
      } catch (e) {
        // Keep as empty arrays if parsing fails
      }

      return {
        id: analysis.id,
        fileName: analysis.fileName,
        createdAt: analysis.createdAt,
        score: analysis.overallScore,
        detailedScores,
        strengths,
        weaknesses,
        suggestions,
        jobDescription: analysis.jobDescription,
      };
    });

    // Calculate average resume score
    const resumesWithScores = resumeAnalytics.filter(
      (resume) => resume.score !== null
    );
    const averageResumeScore =
      resumesWithScores.length > 0
        ? Math.round(
            resumesWithScores.reduce((sum, resume) => sum + resume.score, 0) /
              resumesWithScores.length
          )
        : 0;

    // Recent resume analyses
    const recentResumes = resumeAnalytics.slice(0, 5);

    // Resume skills frequency analysis from detailed scores
    const resumeSkillsMap = new Map();
    resumeAnalytics.forEach((analysis) => {
      if (
        analysis.detailedScores &&
        typeof analysis.detailedScores === "object"
      ) {
        Object.keys(analysis.detailedScores).forEach((skill) => {
          if (!resumeSkillsMap.has(skill)) {
            resumeSkillsMap.set(skill, { count: 0, scores: [] });
          }
          resumeSkillsMap.get(skill).count += 1;
          const skillScore = analysis.detailedScores[skill];
          if (typeof skillScore === "number") {
            resumeSkillsMap.get(skill).scores.push(skillScore);
          }
        });
      }
    });

    const resumeSkillsAnalysis = Array.from(resumeSkillsMap.entries())
      .map(([skill, data]) => ({
        skill,
        count: data.count,
        averageScore:
          data.scores.length > 0
            ? Math.round(
                data.scores.reduce((sum, score) => sum + score, 0) /
                  data.scores.length
              )
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const analytics = {
      totalInterviews,
      completedInterviews,
      averageScore,
      recentInterviews,
      skillsAnalysis,
      monthlyProgress,
      // Resume analytics
      resumeAnalytics: {
        totalResumes: totalResumeAnalyses,
        averageResumeScore,
        recentResumes,
        resumeSkillsAnalysis,
      },
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}
