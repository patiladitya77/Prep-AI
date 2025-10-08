const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request, { params }) {
  try {
    // Get authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const resumeId = params.id;

    // Find the resume and ensure it belongs to the user
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId,
      },
      select: {
        id: true,
        file_name: true,
        parsedData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found or unauthorized" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedResume = {
      id: resume.id,
      fileName: resume.file_name,
      uploadedAt: resume.createdAt.toISOString(),
      parsedData: resume.parsedData || {
        name: "",
        email: "",
        phone: "",
        skills: [],
        experience: [],
        projects: [],
        education: [],
        summary: "No parsed data available",
      },
    };

    return NextResponse.json({
      success: true,
      resume: formattedResume,
    });
  } catch (error) {
    console.error("Error fetching resume details:", error);
    return NextResponse.json(
      { error: "Failed to fetch resume details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
