import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Fetch all goals for the user
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: "User session expired. Please log in again.",
        },
        { status: 401 }
      );
    }

    // Fetch goals for the user
    const goals = await prisma.goal.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST - Create a new goal
export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: "User session expired. Please log in again.",
        },
        { status: 401 }
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
        { status: 400 }
      );
    }

    // Map category to enum value
    const categoryMap = {
      interview: "INTERVIEW",
      learning: "LEARNING",
      practice: "PRACTICE",
      resume: "RESUME",
    };

    const goalCategory = categoryMap[category];
    if (!goalCategory) {
      return NextResponse.json(
        {
          error: "Invalid category",
        },
        { status: 400 }
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
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
