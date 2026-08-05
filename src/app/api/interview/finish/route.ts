import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { generateFeedbackAndScore } from "@/services/scoring";

//helper
function isJsonObject(data: unknown): data is Record<string, any> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

// In-memory fallback storage for when the database is unavailable
const temporaryScores = new Map();
const temporaryAnswers = new Map();

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
    let usedFallback = false;

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
      console.error(
        "❌ Database unavailable, using fallback calculation:",
        dbError,
      );

      // Calculate from temporary storage
      const sessionAnswers = Array.from(temporaryAnswers.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryAnswers.get(key));

      const sessionScores = Array.from(temporaryScores.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryScores.get(key));

      if (sessionAnswers.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No answers found for this session",
          },
          { status: 400 },
        );
      }

      const totalQuestions = 10;
      const answeredQuestions = sessionAnswers.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      // Generate mock results for fallback
      const questionResults = sessionAnswers.map((answer, index) => {
        const score =
          sessionScores.find((s) => s.questionId === answer.questionId)
            ?.score || Math.floor(Math.random() * 4) + 6;

        return {
          questionId: answer.questionId,
          questionText: `Interview Question ${index + 1}`,
          answer: answer.candidateAnswer,
          score: score,
          feedback: `Answer recorded with score ${score}/10 (temporary storage)`,
          submittedAt: answer.submittedAt,
        };
      });

      const totalScore = questionResults.reduce(
        (sum, result) => sum + result.score,
        0,
      );
      const averageScore = totalScore / questionResults.length;

      finalResults = {
        sessionId,
        totalQuestions,
        answeredQuestions,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        overallScore: parseFloat(averageScore.toFixed(1)),
        grade: getGrade(averageScore),
        questionResults,
        overallFeedback:
          generateOverallFeedback(averageScore, completionPercentage) +
          " (Demo mode - results not saved)",
        jobRole: "Software Developer",
        completedAt: new Date().toISOString(),
        fallbackMode: true,
      };

      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...finalResults,
        fallbackMode: usedFallback,
      },
    });
  } catch (error) {
    console.error("❌ Error finishing interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function getGrade(score: number) {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Good";
  if (score >= 7) return "Average";
  if (score >= 6) return "Below Average";
  return "Needs Improvement";
}

function generateOverallFeedback(score: number, completion: number) {
  const grade = getGrade(score);
  let feedback = `You completed ${completion.toFixed(
    0,
  )}% of the interview with an overall score of ${score.toFixed(
    1,
  )}/10 (${grade}). `;

  if (score >= 8) {
    feedback +=
      "Excellent performance! You demonstrated strong knowledge and communication skills.";
  } else if (score >= 7) {
    feedback +=
      "Good job! You showed solid understanding with room for some improvement.";
  } else if (score >= 6) {
    feedback +=
      "Decent performance. Focus on providing more detailed and specific answers.";
  } else {
    feedback +=
      "There's room for improvement. Practice more and focus on giving comprehensive answers.";
  }

  return feedback;
}
