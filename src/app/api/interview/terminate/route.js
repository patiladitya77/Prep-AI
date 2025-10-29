const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

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

    // Parse the request body
    const body = await request.json();
    const { sessionId, reason, warningCount } = body;

    // Validate required fields
    if (!sessionId || !reason) {
      return NextResponse.json(
        { error: "Missing required fields: sessionId, reason" },
        { status: 400 }
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
        { status: 404 }
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
    const isPrismaErr = error && error.name && error.name.startsWith("Prisma");
    if (isPrismaErr) {
      const safeDetails = {
        name: error.name,
        message: error.message,
      };
      if (process.env.NODE_ENV === "development") {
        safeDetails.stack = error.stack;
      }
      return NextResponse.json(
        { error: "Prisma error", details: safeDetails },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to terminate interview session" },
      { status: 500 }
    );
  }
}

module.exports = { POST };
