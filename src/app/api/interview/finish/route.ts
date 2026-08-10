import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import {
  generateFeedbackAndScore,
  getGrade,
  generateOverallFeedback,
  isJsonObject,
} from "@/services/scoring";

export async function POST(request: NextRequest) {
  try {
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      console.error("❌ JSON parsing error in request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 },
      );
    }

    const { sessionId } = requestBody;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    let finalResults;

    try {
      // Get session with all answers and questions from database
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          questions: {
            orderBy: { order: "asc" },
          },
          jd: true,
        },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 },
        );
      }

      const totalQuestions = session.questions.length;
      const answeredQuestions = session.answers.length;

      if (answeredQuestions === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No answers found for this session",
          },
          { status: 400 },
        );
      }

      // Calculate individual question scores using AI
      const questionResults = [];

      for (const question of session.questions) {
        const answer = session.answers.find(
          (a) => a.questionId === question.id,
        );

        if (answer) {
          // Generate AI-powered feedback and score
          const aiResult = await generateFeedbackAndScore(
            question.questionText,
            answer.candidateAnswer,
            session,
          );

          // Store the score back to database
          await prisma.answer.update({
            where: { id: answer.id },
            data: {
              score: aiResult.score,
              feedback: aiResult.feedback,
              strengths: aiResult.strengths,
              improvements: aiResult.improvements,
            },
          });

          questionResults.push({
            questionId: question.id,
            questionText: question.questionText,
            answer: answer.candidateAnswer,
            score: aiResult.score,
            feedback: aiResult.feedback,
            strengths: aiResult.strengths,
            improvements: aiResult.improvements,
            submittedAt: answer.submittedAt,
          });
        }
      }

      // Calculate overall score
      const totalScore = questionResults.reduce(
        (sum, result) => sum + result.score,
        0,
      );
      const averageScore = totalScore / questionResults.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      // Update session as completed
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          score: averageScore,
          endedAt: new Date(),
          feedback: generateOverallFeedback(averageScore, completionPercentage),
        },
      });
      const jdRaw = session.jd?.parsedData;

      const jdData = isJsonObject(jdRaw) ? (jdRaw as Record<string, any>) : {};

      finalResults = {
        sessionId,
        totalQuestions,
        answeredQuestions,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        overallScore: parseFloat(averageScore.toFixed(1)),
        grade: getGrade(averageScore),
        questionResults,
        overallFeedback: generateOverallFeedback(
          averageScore,
          completionPercentage,
        ),
        jobRole: jdData.jobRole ?? "Software Developer",

        completedAt: new Date().toISOString(),
      };
    } catch (dbError) {
      console.error("❌ Database unavailable:", dbError);
      return NextResponse.json(
        { error: "Database unavailable, please try again" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      data: finalResults,
    });
  } catch (error) {
    console.error("❌ Error finishing interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
