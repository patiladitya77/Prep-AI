import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { answers: true, questions: true },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 },
      );
    }

    const totalQuestions = session.questions.length;
    const answeredQuestions = session.answers.length;
    const completion =
      totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        answeredQuestions,
        completion,
        status:
          answeredQuestions === 0
            ? "No answers submitted yet"
            : `${answeredQuestions} of ${totalQuestions} questions answered`,
      },
    });
  } catch (error) {
    console.error("❌ Error calculating score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: { answers: true, questions: true },
    });

    if (!session || session.userId !== userId) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 },
      );
    }

    const totalQuestions = session.questions.length;
    const answeredQuestions = session.answers.length;
    const completionPercentage =
      totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        totalQuestions,
        answeredQuestions,
        overallScore: 0,
        completion: parseFloat(completionPercentage.toFixed(1)),
        status: session.status,
      },
    });
  } catch (error) {
    console.error("❌ Error getting score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
