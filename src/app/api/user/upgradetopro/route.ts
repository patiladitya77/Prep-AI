import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "@/lib/auth/requireAuth";

const prisma = new PrismaClient();
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { isPremium: true },
    });
    return NextResponse.json({
      message: "User upgraded to Premium successfully",
    });
  } catch (error) {
    console.error("❌ Error fetching completed interviews:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
