const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fs = require("fs").promises;
const path = require("path");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

export async function DELETE(request, { params }) {
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

    // Find the resume to ensure it belongs to the user
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId,
      },
    });

    if (!resume) {
      return NextResponse.json(
        { error: "Resume not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the file from filesystem if it exists (using correct field name)
    if (resume.file_path) {
      try {
        const fullPath = path.join(process.cwd(), "public", resume.file_path);
        await fs.unlink(fullPath);
      } catch (fileError) {
        console.log("File not found or already deleted:", fileError.message);
      }
    }

    // Delete the resume from database
    await prisma.resume.delete({
      where: {
        id: resumeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    return NextResponse.json(
      { error: "Failed to delete resume" },
      { status: 500 }
    );
  }
}
