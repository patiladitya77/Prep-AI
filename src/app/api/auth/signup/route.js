const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const {
  hashPassword,
  generateToken,
  excludePassword,
  validateEmail,
  validatePassword,
  validatePasswordDetailed,
  validateName,
} = require("@/lib/auth/helpers");

const prisma = new PrismaClient();

async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

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

    // Use detailed password validation and return structured errors the frontend expects
    const pwdValidation = validatePasswordDetailed(password);
    if (!pwdValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          errors: pwdValidation.errors.map((msg) => ({ msg })),
        },
        { status: 400 }
      );
    }

    if (!validateName(name)) {
      return NextResponse.json(
        {
          success: false,
          message: "Name must be at least 2 characters long",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
        name: name.trim(),
      },
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Return user data without password
    const userResponse = excludePassword(user);

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: userResponse,
          token,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
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
    await prisma.$disconnect();
  }
}

module.exports = { POST };
