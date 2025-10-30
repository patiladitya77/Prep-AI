import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken"


const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

async function POST(request) {
  try {
    // Get token from Authorization header (to match existing auth system)
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Parse the request body
    const body = await request.json();
    const {
      jobRole,
      jobDescription,
      experienceYears,
      resumeFileName,
      existingResumeId,
    } = body;

    // Validate required fields
    if (!jobRole || !jobDescription || experienceYears === undefined) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: jobRole, jobDescription, experienceYears",
        },
        { status: 400 }
      );
    }

    // Validate experience years is a valid number
    const expYears = parseInt(experienceYears);
    if (isNaN(expYears) || expYears < 0) {
      return NextResponse.json(
        { error: "Experience years must be a valid non-negative number" },
        { status: 400 }
      );
    }

    // Handle resume - either use existing or create new one
    let resumeId;

    if (existingResumeId) {
      // Verify the resume belongs to the user
      const existingResume = await prisma.resume.findFirst({
        where: {
          id: existingResumeId,
          userId: userId,
        },
      });

      if (existingResume) {
        resumeId = existingResumeId;
      } else {
        return NextResponse.json(
          { error: "Resume not found or unauthorized" },
          { status: 404 }
        );
      }
    } else {
      // Create a placeholder resume record if no existing resume is provided
      try {
        const resume = await prisma.resume.create({
          data: {
            userId: userId,
            file_name: resumeFileName || "No resume uploaded",
            file_path: null, // Will be set when file is actually uploaded
            parsedData: {
              name: "",
              skills: [],
              experience: [],
              education: [],
              summary:
                "Please upload your resume for better question generation",
            },
          },
        });
        resumeId = resume.id;
      } catch (error) {
        console.error("Error creating resume:", error);
        return NextResponse.json(
          { error: "Failed to create resume record" },
          { status: 500 }
        );
      }
    }

    // Create JD (Job Description) record
    let jdRecord;
    try {
      jdRecord = await prisma.jD.create({
        data: {
          userId: userId,
          parsedData: {
            title: jobRole,
            skillsReq: jobDescription.split(",").map((skill) => skill.trim()),
            expReq: expYears,
          },
        },
      });
    } catch (error) {
      console.error("Error creating JD:", error);
      return NextResponse.json(
        { error: "Failed to create job description record" },
        { status: 500 }
      );
    }

    // Create Interview Session
    try {
      const interviewSession = await prisma.interviewSession.create({
        data: {
          userId: userId,
          resumeId: resumeId,
          jdId: jdRecord.id,
          status: "ACTIVE",
          score: 0,
          feedback: "",
          startedAt: new Date(),
          endedAt: null,
        },
      });

      // Automatically trigger question generation
      console.log("🧩 Generating questions with data:", {
        sessionId: interviewSession.id,
        jobRole,
        jobDescription,
        experienceLevel: expYears,
      });

      try {
        const questionGenerationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          }/api/interview/generate-questions`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              sessionId: interviewSession.id,
              jobDescription: jobDescription,
              experienceLevel: expYears,
              jobRole: jobRole,
            }),
          }
        );

        // if (!questionGenerationResponse.ok) {
        //   console.error("Failed to generate questions automatically");
        // }
        const questionData = await questionGenerationResponse.json();
        if (!questionGenerationResponse.ok) {
          console.error("Failed to generate questions automatically:", questionData);
        } else {
          console.log("✅ Questions generated successfully:", questionData?.questions?.length || 0);
        }

      } catch (questionError) {
        console.error("Error generating questions:", questionError);
        // Don't fail the session creation if question generation fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "Interview session created successfully",
          data: {
            sessionId: interviewSession.id,
            jdId: jdRecord.id,
            resumeId: resumeId,
            jobRole: jobRole,
            experienceYears: expYears,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      console.error("Error creating interview session:", error);
      return NextResponse.json(
        { error: "Failed to create interview session" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { POST };
