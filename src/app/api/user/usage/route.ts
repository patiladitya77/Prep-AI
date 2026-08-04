import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth/requireAuth";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPremium: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's interview sessions count
    const interviewCount = await prisma.interviewSession.count({
      where: { userId: userId },
    });

    // Get user's resume count
    const resumeCount = await prisma.resume.count({
      where: { userId: userId },
    });

    // Define limits (you can make these configurable)
    let limits;
    if (user.isPremium) {
      limits = {
        interviews: 20,
        resumes: 20,
      };
    } else {
      limits = {
        interviews: 5,
        resumes: 6,
      };
    }

    // Calculate usage statistics
    const usage = {
      interviews: {
        used: interviewCount,
        limit: limits.interviews,
        percentage: Math.round((interviewCount / limits.interviews) * 100),
      },
      resumes: {
        used: resumeCount,
        limit: limits.resumes,
        percentage: Math.round((resumeCount / limits.resumes) * 100),
      },
    };

    return NextResponse.json({ usage });
  } catch (error) {
    console.error("Error updating goal:", error);

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 },
    );
  }
}
