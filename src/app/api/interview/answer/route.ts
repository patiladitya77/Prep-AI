import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

// In-memory fallback storage for when the database is unavailable
const temporaryAnswers = new Map();

export async function POST(request: NextRequest) {
  try {
    const { sessionId, questionId, answer } = await request.json();

    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: "Session ID, Question ID, and answer are required" },
        { status: 400 },
      );
    }

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    let savedAnswer;
    let usedFallback = false;

    try {
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: { questions: true, user: true, jd: true, resume: true },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 },
        );
      }

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question || question.sessionId !== sessionId) {
        return NextResponse.json(
          { error: "Question not found in this session" },
          { status: 404 },
        );
      }

      const existingAnswer = await prisma.answer.findFirst({
        where: { sessionId, questionId },
      });

      if (existingAnswer) {
        savedAnswer = await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: { candidateAnswer: answer, submittedAt: new Date() },
        });
      } else {
        savedAnswer = await prisma.answer.create({
          data: { sessionId, questionId, candidateAnswer: answer },
        });
      }
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback storage:",
        dbError,
      );
      const answerId = `${sessionId}_${questionId}`;
      savedAnswer = {
        id: answerId,
        sessionId,
        questionId,
        candidateAnswer: answer,
        submittedAt: new Date().toISOString(),
      };
      temporaryAnswers.set(answerId, savedAnswer);
      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      message: `Answer saved successfully${usedFallback ? " (using temporary storage)" : ""}`,
      data: {
        answerId: savedAnswer.id,
        submittedAt: savedAnswer.submittedAt,
        fallbackMode: usedFallback,
      },
    });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
