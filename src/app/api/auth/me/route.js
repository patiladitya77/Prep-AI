const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { verifyToken, excludePassword } = require("@/lib/auth/helpers");

const prisma = new PrismaClient();

async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "No authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const safeUser = excludePassword(user);
    return NextResponse.json(
      { success: true, data: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("/api/auth/me error", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { GET };
