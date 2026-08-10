import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";

async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    // Parse the request body
    const body = await request.json();
    const { sessionId, reason, warningCount } = body;

    // Validate required fields
    if (!sessionId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, reason" },
        { status: 400 },
      );
    }

    // Verify the session belongs to the user
    const session = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: userId,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Interview session not found or unauthorized" },
        { status: 404 },
      );
    }

    // Update the interview session
    const updatedSession = await prisma.interviewSession.update({
      where: {
        id: sessionId,
      },
      data: {
        status: "ABANDONED",
        endedAt: new Date(),
        feedback: `Interview terminated: ${reason}. Warning count: ${
          warningCount || 0
        }`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Interview session terminated successfully",
      sessionId: updatedSession.id,
    });
  } catch (error) {
    console.error("Error terminating interview session:", error);

    // If Prisma engine returned an error with additional metadata, include
    // small, non-sensitive details to aid debugging in dev.
    const isPrismaErr =
      error &&
      typeof error === "object" &&
      "name" in error &&
      typeof (error as any).name === "string" &&
      (error as any).name.startsWith("Prisma");
    if (isPrismaErr) {
      const err = error as Error;

      const safeDetails: {
        name: string;
        message: string;
        stack?: string;
      } = {
        name: err.name,
        message: err.message,
      };

      if (process.env.NODE_ENV === "development" && err.stack) {
        safeDetails.stack = err.stack;
      }

      return NextResponse.json(
        { error: "Prisma error", details: safeDetails },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to terminate interview session" },
      { status: 500 },
    );
  }
}

module.exports = { POST };
