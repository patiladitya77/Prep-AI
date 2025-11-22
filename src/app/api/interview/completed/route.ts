import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/helpers.js";
import { prisma } from "../../../../lib/prisma";
function isJsonObject(data: unknown): data is Record<string, any> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
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

    // Fetch completed interview sessions with their results
    const completedInterviews = await prisma.interviewSession.findMany({
      where: {
        userId: userId,
        status: "COMPLETED",
      },
      include: {
        jd: true,
        resume: true,
        questions: {
          include: {
            answers: true,
          },
        },
        _count: {
          select: {
            questions: true,
            answers: true,
          },
        },
      },
      orderBy: {
        startedAt: "desc",
      },
    });

    // Process the data to include calculated scores and completion info
    const processedInterviews = completedInterviews.map((session) => {
      const totalQuestions = session._count.questions;
      const totalAnswers = session._count.answers;
      const completionPercentage =
        totalQuestions > 0
          ? Math.round((totalAnswers / totalQuestions) * 100)
          : 0;

      // Calculate overall score from answers
      const answersWithScores = session.questions
        .flatMap((q) => q.answers)
        .filter((answer) => answer.score !== null);

      const overallScore =
        answersWithScores.length > 0
          ? answersWithScores.reduce(
              (sum, answer) => sum + (answer.score || 0),
              0
            ) / answersWithScores.length
          : 0;

      // Determine grade
      let grade = "Not Graded";
      if (overallScore >= 9) grade = "Excellent";
      else if (overallScore >= 8) grade = "Very Good";
      else if (overallScore >= 7) grade = "Good";
      else if (overallScore >= 6) grade = "Average";
      else if (overallScore >= 5) grade = "Below Average";
      else if (overallScore > 0) grade = "Needs Improvement";
      const jdRaw = session.jd?.parsedData;
      let jdData: Record<string, any> = {};

      if (isJsonObject(jdRaw)) {
        jdData = jdRaw;
      }
      return {
        id: session.id,
        jobRole: jdData.title || jdData.jobRole || "Unknown Position",
        experienceLevel: jdData.expReq || jdData.experienceLevel || "0",
        createdAt: session.endedAt || session.startedAt,
        updatedAt: session.endedAt || session.startedAt,

        overallScore: parseFloat(overallScore.toFixed(1)),
        grade: grade,
        totalQuestions: totalQuestions,
        answeredQuestions: totalAnswers,
        completionPercentage: completionPercentage,
        status: session.status,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        interviews: processedInterviews,
        totalCompleted: processedInterviews.length,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching completed interviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}
