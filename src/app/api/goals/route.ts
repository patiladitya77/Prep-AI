import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { GoalCategory } from "@prisma/client";

// GET - Fetch all goals for the user
export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User session expired. Please log in again." },
        { status: 401 },
      );
    }

    // Fetch goals for the user
    const goals = await prisma.goal.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ goals });
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

// POST - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        { error: "User session expired. Please log in again." },
        { status: 401 },
      );
    }

    // Parse request body
    const { title, description, category, targetDate } = await request.json();

    // Validate required fields
    if (!title || !category || !targetDate) {
      return NextResponse.json(
        {
          error: "Title, category, and target date are required",
        },
        { status: 400 },
      );
    }

    // Map category to enum value
    const categoryMap: Record<
      "interview" | "learning" | "practice" | "resume",
      GoalCategory
    > = {
      interview: GoalCategory.INTERVIEW,
      learning: GoalCategory.LEARNING,
      practice: GoalCategory.PRACTICE,
      resume: GoalCategory.RESUME,
    };

    const goalCategory = categoryMap[category as keyof typeof categoryMap];

    if (!goalCategory) {
      return NextResponse.json(
        {
          error: "Invalid category",
        },
        { status: 400 },
      );
    }

    // Create the goal
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description: description || "",
        category: goalCategory,
        targetDate: new Date(targetDate),
        completed: false,
        progress: 0,
      },
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);

    if (error instanceof Error && error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 },
    );
  }
}
