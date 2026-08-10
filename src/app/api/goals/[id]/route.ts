import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAuthWithUser } from "@/lib/auth/requireAuthWithUser";
import { GoalCategory } from "@prisma/client";

// PUT - Update a goal
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const auth = await requireAuthWithUser(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const goalId = params.id;
    const { title, description, category, targetDate, completed, progress } =
      await request.json();

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Prepare update data

    interface IupdateData {
      title?: string;
      description?: string;
      targetDate?: Date;
      completed?: boolean;
      progress?: number;
      category?: GoalCategory;
    }
    const updateData: IupdateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetDate !== undefined) updateData.targetDate = new Date(targetDate);
    if (completed !== undefined) {
      updateData.completed = completed;
      // Auto-update progress when marking as completed/incomplete
      updateData.progress = completed ? 100 : 0;
    }
    if (progress !== undefined && completed === undefined) {
      updateData.progress = Math.max(0, Math.min(100, progress));
      // Auto-complete if progress reaches 100
      if (progress >= 100) updateData.completed = true;
    }

    if (category !== undefined) {
      const categoryMap: Record<
        "interview" | "learning" | "practice" | "resume",
        string
      > = {
        interview: "INTERVIEW",
        learning: "LEARNING",
        practice: "PRACTICE",
        resume: "RESUME",
      };
      const goalCategory = categoryMap[category as keyof typeof categoryMap];
      if (!goalCategory) {
        return NextResponse.json(
          { error: "Invalid category" },
          { status: 400 },
        );
      }
      updateData.category = goalCategory as GoalCategory;
    }

    // Update the goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return NextResponse.json({ goal: updatedGoal });
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

// DELETE - Delete a goal
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const params = await props.params;
    const auth = await requireAuthWithUser(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;

    const goalId = params.id;

    // Check if goal exists and belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id: goalId, userId: userId },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Delete the goal
    await prisma.goal.delete({
      where: { id: goalId },
    });

    return NextResponse.json({ message: "Goal deleted successfully" });
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
