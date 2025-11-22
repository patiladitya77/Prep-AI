import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fallback mock questions for when database is unavailable
const fallbackQuestions = [
  {
    id: "fallback-1",
    sessionId: "fallback-session",
    questionText: "Tell me about yourself and your background in technology.",
    order: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-2",
    sessionId: "fallback-session",
    questionText:
      "What programming languages are you most comfortable with and why?",
    order: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-3",
    sessionId: "fallback-session",
    questionText:
      "Describe a challenging technical problem you've solved recently.",
    order: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-4",
    sessionId: "fallback-session",
    questionText:
      "How do you stay updated with new technologies and industry trends?",
    order: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-5",
    sessionId: "fallback-session",
    questionText:
      "Tell me about a project you're particularly proud of. What was your role?",
    order: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-6",
    sessionId: "fallback-session",
    questionText:
      "How do you approach debugging when you encounter an issue in your code?",
    order: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-7",
    sessionId: "fallback-session",
    questionText: "Describe your experience working in a team environment.",
    order: 7,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-8",
    sessionId: "fallback-session",
    questionText:
      "What factors do you consider when choosing between different technical solutions?",
    order: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-9",
    sessionId: "fallback-session",
    questionText:
      "How do you handle tight deadlines and pressure in your work?",
    order: 9,
    createdAt: new Date().toISOString(),
  },
  {
    id: "fallback-10",
    sessionId: "fallback-session",
    questionText:
      "Where do you see yourself in your career five years from now?",
    order: 10,
    createdAt: new Date().toISOString(),
  },
];

async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify the JWT token
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

    // Get sessionId from URL parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId parameter" },
        { status: 400 }
      );
    }

    // Verify the session belongs to the user and get questions
    let session;
    let questions;
    let jobDescription;
    let usedFallback = false;

    try {
      // Try to get from database
      session = await prisma.interviewSession.findFirst({
        where: {
          id: sessionId,
          userId: userId,
        },
        include: {
          questions: {
            orderBy: { order: "asc" },
          },
          jd: true,
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Interview session not found or unauthorized" },
          { status: 404 }
        );
      }

      questions = session.questions;
      jobDescription = session.jd;
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback questions:",
        dbError
      );

      // Use fallback questions when database is unavailable
      questions = fallbackQuestions.map((q) => ({ ...q, sessionId }));
      jobDescription = {
        id: "fallback-jd",
        parsedData: {
          jobRole: "Software Developer",
          experienceLevel: "3",
          jobDescription: "General software development position",
        },
      };

      session = {
        id: sessionId,
        status: "ACTIVE",
        startedAt: new Date().toISOString(),
        endedAt: null,
      };

      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        fallbackMode: usedFallback,
      },
      questions: questions,
      jobDescription: jobDescription,
      fallbackMode: usedFallback,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { GET };
