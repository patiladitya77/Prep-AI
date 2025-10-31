import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function POST(request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Check user's interview usage limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get usage limits based on user type
    const interviewLimit = user.isPremium ? 50 : 5;
    const interviewsUsed = user.interviewAttempts || 0;

    // Check if user has reached their interview limit
    if (interviewsUsed >= interviewLimit) {
      return NextResponse.json(
        { 
          error: "Interview limit reached",
          message: user.isPremium 
            ? "You have exhausted your premium interview limit"
            : "You have reached your interview limit. Please upgrade to continue.",
          limitReached: true,
          used: interviewsUsed,
          limit: interviewLimit
        },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { originalSessionId } = body;

    // Validate required fields
    if (!originalSessionId) {
      return NextResponse.json(
        { error: "Missing required field: originalSessionId" },
        { status: 400 }
      );
    }

    // Get the original interview session with JD, Resume, and Questions
    const originalSession = await prisma.interviewSession.findFirst({
      where: {
        id: originalSessionId,
        userId: userId, // Ensure user owns the session
      },
      include: {
        jd: true,
        resume: true,
        questions: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!originalSession) {
      return NextResponse.json(
        { error: "Original interview session not found or unauthorized" },
        { status: 404 }
      );
    }

    if (!originalSession.questions || originalSession.questions.length === 0) {
      return NextResponse.json(
        { error: "Original interview session has no questions to re-attempt" },
        { status: 400 }
      );
    }

    // Create a new interview session using the same JD and Resume
    const newSession = await prisma.interviewSession.create({
      data: {
        userId: userId,
        resumeId: originalSession.resumeId,
        jdId: originalSession.jdId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    // Copy the exact same questions from the original session
    const questionPromises = originalSession.questions.map((originalQuestion) =>
      prisma.question.create({
        data: {
          sessionId: newSession.id,
          questionText: originalQuestion.questionText,
          order: originalQuestion.order,
        },
      })
    );

    await Promise.all(questionPromises);

    // Update user's interview attempt count
    await prisma.user.update({
      where: { id: userId },
      data: {
        interviewAttempts: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: newSession.id,
      message: "Interview re-attempted successfully with original questions",
      questionsCount: originalSession.questions.length,
    });
  } catch (error) {
    console.error("Error re-attempting interview:", error);
    const isPrismaErr = error && error.name && error.name.startsWith("Prisma");
    if (isPrismaErr) {
      const safeDetails = { name: error.name, message: error.message };
      if (process.env.NODE_ENV === "development")
        safeDetails.stack = error.stack;
      return NextResponse.json(
        { error: "Prisma error", details: safeDetails },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to re-attempt interview" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
