import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "./requireAuth";

type AuthWithUserSuccess = { userId: string };
type AuthWithUserFailure = NextResponse;

/**
 * Combines JWT verification (requireAuth) with a database user-exists check.
 * Returns `{ userId }` on success, or a 401 NextResponse on failure.
 *
 * Usage:
 *   const auth = await requireAuthWithUser(request);
 *   if (auth instanceof NextResponse) return auth;
 *   const { userId } = auth;
 */
export async function requireAuthWithUser(
  request: NextRequest,
): Promise<AuthWithUserSuccess | AuthWithUserFailure> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const { userId } = auth;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json(
      { error: "User session expired. Please log in again." },
      { status: 401 },
    );
  }

  return { userId };
}
