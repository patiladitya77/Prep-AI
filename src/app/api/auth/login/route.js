const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const {
  comparePassword,
  generateToken,
  excludePassword,
  validateEmail,
} = require("@/lib/auth/helpers");

const prisma = new PrismaClient();

async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid email",
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message: "Password is required",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data without password
    const userResponse = excludePassword(user);

    return NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          token,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { POST };
