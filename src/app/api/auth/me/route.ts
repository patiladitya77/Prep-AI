import { NextRequest, NextResponse } from "next/server";
import { excludePassword, verifyToken } from "@/lib/auth/helpers";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../../../lib/prisma";

async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, message: "No authorization token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: string | JwtPayload;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }
    //for type safety
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
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
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { GET };
