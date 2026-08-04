import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

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
          { status: 404 },
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
      { status: 200 },
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { GET };
