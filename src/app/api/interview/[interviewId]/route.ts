import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { getGrade, isJsonObject } from "@/services/scoring";

interface interviewParams {
  params: Promise<{ interviewId: string }>;
}

export async function GET(request: NextRequest, props: interviewParams) {
  try {
    const { interviewId } = await props.params;

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 },
      );
    }

    const interviewSession = await prisma.interviewSession.findUnique({
      where: { id: interviewId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        jd: true,
        resume: true,
        questions: {
          include: { answers: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!interviewSession) {
      return NextResponse.json(
        { error: "Interview session not found" },
        { status: 404 },
      );
    }

    if (interviewSession.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized access to this interview session" },
        { status: 403 },
      );
    }

    const questionResults = interviewSession.questions.map((question) => {
      const answer = question.answers[0];
      return {
        questionId: question.id,
        questionText: question.questionText,
        order: question.order,
        answer: answer?.candidateAnswer ?? null,
        score: answer?.score ?? null,
        feedback: answer?.feedback ?? null,
        strengths: answer?.strengths ?? null,
        improvements: answer?.improvements ?? null,
        submittedAt: answer?.submittedAt ?? null,
      };
    });

    const answersWithScores = questionResults.filter((q) => q.score !== null);
    const overallScore =
      answersWithScores.length > 0
        ? answersWithScores.reduce((sum, q) => sum + (q.score ?? 0), 0) /
          answersWithScores.length
        : 0;

    const totalQuestions = interviewSession.questions.length;
    const answeredQuestions = questionResults.filter(
      (q) => q.answer !== null,
    ).length;
    const completionPercentage =
      totalQuestions > 0
        ? Math.round((answeredQuestions / totalQuestions) * 100)
        : 0;

    const jdData = isJsonObject(interviewSession.jd?.parsedData)
      ? (interviewSession.jd!.parsedData as Record<string, any>)
      : {};
    const resumeData = isJsonObject(interviewSession.resume?.parsedData)
      ? (interviewSession.resume!.parsedData as Record<string, any>)
      : {};

    return NextResponse.json({
      success: true,
      data: {
        sessionId: interviewSession.id,
        jobRole: jdData.title || jdData.jobRole || "Unknown Position",
        experienceLevel: jdData.expReq || jdData.experienceLevel || "0",
        createdAt: interviewSession.startedAt,
        updatedAt: interviewSession.endedAt || interviewSession.startedAt,
        status: interviewSession.status,
        overallScore: parseFloat(overallScore.toFixed(1)),
        grade: overallScore > 0 ? getGrade(overallScore) : "Not Graded",
        totalQuestions,
        answeredQuestions,
        completionPercentage,
        questionResults,
        jobDescription: interviewSession.jd?.parsedData ?? null,
        candidateInfo: interviewSession.resume?.parsedData ?? null,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching interview details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
