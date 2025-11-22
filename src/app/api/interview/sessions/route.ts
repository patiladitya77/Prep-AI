import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import { prisma } from "../../../../lib/prisma";
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header (to match existing auth system)
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
    //for type safety
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    // Check if specific sessionId is requested
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Fetch specific interview session
      const session = await prisma.interviewSession.findFirst({
        where: {
          id: sessionId,
          userId: userId,
        },
        include: {
          resume: true,
          questions: true,
          jd: true,
        },
      });

      if (!session) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        session: session,
      });
    }

    // Fetch all interview sessions for this user with related data
    const interviewSessions = await prisma.interviewSession.findMany({
      where: {
        userId: userId,
      },
      include: {
        resume: true,
        questions: true,
        jd: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // Format the response data
    const formattedSessions = interviewSessions.map((session) => ({
      sessionId: session.id,
      status: session.status,
      score: session.score,
      feedback: session.feedback,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      // jobRole: session.job_role,
      // jobDescription: session.job_description,
      // experienceYears: session.experience_years,
      jd: session.jd ? session.jd.parsedData : null,
      resume: session.resume
        ? {
            id: session.resume.id,
            fileName: session.resume.file_name,
            parsedData: session.resume.parsedData,
          }
        : null,
    }));

    return NextResponse.json(
      {
        success: true,
        data: formattedSessions,
      },
      { status: 200 }
    );
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
