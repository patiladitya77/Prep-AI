import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { validateEmail } from "@/lib/auth/helpers";
import crypto from "crypto";

async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email address",
        },
        { status: 400 }
      );
    }

    // Find user with email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email.toLowerCase(),
          mode: "insensitive",
        },
      },
    });

    // Always return success for security reasons (don't reveal if email exists)
    // But only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry,
        },
      });

      const resetUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/reset-password?token=${resetToken}&email=${encodeURIComponent(
        email.toLowerCase()
      )}`;

      // TODO: Implement email sending
      // await sendPasswordResetEmail(email, resetToken);

      // In development, return the reset link for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json(
          {
            success: true,
            message: "Password reset link generated successfully",
            resetUrl: resetUrl, // Only in development
            email: email,
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "If an account with that email exists, we've sent a password reset link",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined,
      },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { POST };
