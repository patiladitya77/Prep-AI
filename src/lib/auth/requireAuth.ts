import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

type AuthSuccess = { userId: string };
type AuthFailure = NextResponse;

/**
 * Extracts and verifies the Bearer JWT from the request.
 * Returns `{ userId }` on success, or a 401 NextResponse on failure.
 *
 * Usage:
 *   const auth = requireAuth(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId } = auth;
 */
export function requireAuth(request: NextRequest): AuthSuccess | AuthFailure {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized - No token provided" },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);

  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (typeof decoded === "string" || !("userId" in decoded)) {
    return NextResponse.json(
      { error: "Invalid token payload" },
      { status: 401 },
    );
  }

  return { userId: decoded.userId as string };
}
