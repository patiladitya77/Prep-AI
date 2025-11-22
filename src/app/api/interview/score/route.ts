import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

import { prisma } from "../../../../lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET!;

// Temporary storage for fallback mode
const temporaryScores = new Map();
const temporaryAnswers = new Map();

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    //for type safety
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    // Calculate final score and update session
    let sessionData;
    let usedFallback = false;

    try {
      // Get session with all answers from database
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          answers: true,
          questions: true,
        },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }

      const totalQuestions = session.questions.length;
      const answeredQuestions = session.answers.length;
      const completion =
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      // Return progress information without scores (scores calculated only when finishing interview)
      return NextResponse.json({
        success: true,
        data: {
          totalQuestions,
          answeredQuestions,
          completion: completion,
          status:
            answeredQuestions === 0
              ? "No answers submitted yet"
              : `${answeredQuestions} of ${totalQuestions} questions answered`,
        },
      });
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback calculation:",
        dbError
      );

      // Calculate from temporary storage
      const sessionAnswers = Array.from(temporaryAnswers.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryAnswers.get(key));

      const totalQuestions = 10; // Default fallback
      const answeredQuestions = sessionAnswers.length;
      const completion =
        totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          totalQuestions,
          answeredQuestions,
          completion: completion,
          status:
            answeredQuestions === 0
              ? "No answers submitted yet"
              : `${answeredQuestions} of ${totalQuestions} questions answered`,
          fallbackMode: true,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error calculating score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
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
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    //for type safety
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    // Try database first, fallback to memory store
    let sessionData;
    let usedFallback = false;

    try {
      // Try to get from database
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          answers: true,
          questions: true,
        },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }

      const totalQuestions = session.questions.length;
      const answeredQuestions = session.answers.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      sessionData = {
        sessionId: sessionId,
        totalQuestions,
        answeredQuestions,
        overallScore: 0, // No scoring until final submission
        completion: parseFloat(completionPercentage.toFixed(1)),
        status: session.status,
      };
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback storage:",
        dbError
      );

      // Calculate from temporary storage
      const sessionAnswers = Array.from(temporaryAnswers.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryAnswers.get(key));

      const sessionScores = Array.from(temporaryScores.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryScores.get(key));

      const totalQuestions = 10; // Default fallback
      const answeredQuestions = sessionAnswers.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      sessionData = {
        sessionId: sessionId,
        totalQuestions,
        answeredQuestions,
        overallScore: 0, // No scoring until final submission
        completion: parseFloat(completionPercentage.toFixed(1)),
        status: answeredQuestions === totalQuestions ? "COMPLETED" : "ACTIVE",
      };
      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...sessionData,
        fallbackMode: usedFallback,
      },
    });
  } catch (error) {
    console.error("❌ Error getting score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
