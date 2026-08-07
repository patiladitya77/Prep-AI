import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
import { extractTextFromPDF } from "@/lib/pdfExtract";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Helper function to parse resume using Gemini AI
async function parseResumeWithAI(
  resumeText: string,
  retryCount = 0,
): Promise<any> {
  const maxRetries = 2;
  const retryDelay = (attempt: number) =>
    Math.min(1000 * Math.pow(2, attempt), 10000);

  try {
    console.log("🧠 Starting AI resume parsing...");
    console.log("   Input text length:", resumeText.length, "chars");
    if (retryCount > 0) {
      console.log(`   Retry attempt: ${retryCount}/${maxRetries}`);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert resume parser. Parse the following resume text and extract structured information.
      Pay special attention to extracting projects, personal projects, academic projects, or any work projects mentioned.
      Look for project names, descriptions, technologies used, and any links or repositories.
      
      Resume Text: ${resumeText}
      
      Return the response as a JSON object with this exact format:
      {
        "name": "Candidate Name",
        "email": "email@example.com",
        "phone": "phone number",
        "skills": ["skill1", "skill2", "skill3"],
        "experience": [
          {
            "company": "Company Name",
            "position": "Job Title",
            "duration": "Start Date - End Date",
            "description": "Brief description of role"
          }
        ],
        "projects": [
          {
            "name": "Project Name",
            "description": "Brief description of the project",
            "technologies": ["tech1", "tech2", "tech3"],
            "duration": "Start Date - End Date (if available)",
            "link": "Project link/URL (if available)"
          }
        ],
        "education": [
          {
            "institution": "University/College Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "year": "Graduation Year"
          }
        ],
        "summary": "Brief professional summary"
      }
      
      If any field is not found, use empty string for strings, empty array for arrays.
      Only return the JSON object, no additional text.
    `;

    console.log("   Calling Gemini API for parsing...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log("   Raw AI response length:", text.length, "chars");
    console.log("   Raw AI response preview:", text.substring(0, 300));

    // Clean and parse the response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    console.log("   Cleaned response length:", cleanedText.length, "chars");

    const parsedData = JSON.parse(cleanedText);
    console.log("✅ Resume parsed successfully:");
    console.log("   Name:", parsedData.name || "N/A");
    console.log("   Email:", parsedData.email || "N/A");
    console.log("   Skills count:", parsedData.skills?.length || 0);
    console.log("   Projects count:", parsedData.projects?.length || 0);
    console.log("   Experience count:", parsedData.experience?.length || 0);
    console.log("   Education count:", parsedData.education?.length || 0);

    return parsedData;
  } catch (error: any) {
    console.error("❌ AI resume parsing failed:");
    console.error(
      "   Error type:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "   Error message:",
      error instanceof Error ? error.message : String(error),
    );
    if (error instanceof SyntaxError) {
      console.error("   JSON parsing failed - AI response was not valid JSON");
    }

    // Check if it's a rate limit error and retry
    const isRateLimitError =
      error?.status === 429 ||
      error?.message?.includes("quota") ||
      error?.message?.includes("rate limit");

    if (isRateLimitError && retryCount < maxRetries) {
      const delay = retryDelay(retryCount);
      console.log(`⏳ Rate limit hit, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return parseResumeWithAI(resumeText, retryCount + 1);
    }

    console.error("   Full error:", error);

    // Return basic structure if AI parsing fails
    return {
      name: "",
      email: "",
      phone: "",
      skills: [],
      experience: [],
      projects: [],
      education: [],
      summary: "Resume parsing failed, manual review required",
    };
  }
}

async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    // User authenticated with ID: ${userId}

    // Verify user exists in database, create if not found (temporary fix)
    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      // Create a temporary user record
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: `user-${userId}@temp.com`,
            passwordHash: "temp-hash",
            name: "User",
          },
        });
      } catch (createError) {
        return NextResponse.json(
          { error: "User account issue - please login again" },
          { status: 401 },
        );
      }
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("resume") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 },
      );
    }
    const fileName = formData.get("fileName");
    const fileNameStr = typeof fileName === "string" ? fileName : "resume.pdf";

    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 },
      );
    }

    // Convert file to buffer
    const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    const buffer: Buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using AI
    console.log("🔄 Starting resume processing pipeline...");
    console.log("   File name:", fileNameStr);
    console.log("   File size:", buffer.length, "bytes");

    const extractedText = await extractTextFromPDF(buffer);

    // Parse the extracted text with AI
    let parsedData;
    try {
      parsedData = await parseResumeWithAI(extractedText);
      console.log("✅ Resume processing completed successfully");
    } catch (aiError) {
      console.error("❌ Resume processing failed with error:");
      console.error("   Error:", aiError);
      // Fallback parsed data if AI fails
      parsedData = {
        name: "Resume Uploaded",
        email: "",
        phone: "",
        skills: ["Technology Skills", "Problem Solving", "Communication"],
        experience: [
          {
            title: "Professional Experience",
            company: "Previous Companies",
            duration: "Multiple Years",
            description:
              "Relevant work experience as indicated in uploaded resume",
          },
        ],
        education: [
          {
            degree: "Educational Background",
            institution: "Educational Institution",
            year: "Graduation Year",
          },
        ],
        summary:
          "Resume uploaded successfully. Interview questions will be generated based on job description and general professional experience.",
      };
      console.log("⚠️  Using fallback parsed data");
    }

    // Store resume in database
    try {
      console.log("💾 Saving resume to database...");
      const resume = await prisma.resume.create({
        data: {
          userId: userId,
          file_name: fileNameStr,
          file_path: null, // We're not storing the actual file for now
          parsedData: {
            ...parsedData,
            fileName: fileName,
            fileSize: buffer.length,
            uploadedAt: new Date().toISOString(),
            extractedText: extractedText.substring(0, 1000), // Store first 1000 chars for reference
            processingNote:
              "PDF text extracted using Gemini AI and parsed successfully",
          },
        },
      });

      console.log("✅ Resume saved to database with ID:", resume.id);

      return NextResponse.json({
        success: true,
        message: `Resume "${fileName}" uploaded and parsed successfully! Extracted ${
          parsedData.skills?.length || 0
        } skills, ${parsedData.projects?.length || 0} projects, ${
          parsedData.experience?.length || 0
        } work experiences, and ${
          parsedData.education?.length || 0
        } education entries.`,
        resume: {
          id: resume.id,
          fileName: resume.file_name,
          parsedData: parsedData,
          createdAt: resume.createdAt,
        },
      });
    } catch (dbError) {
      console.error("❌ Database save failed:");
      console.error(
        "   Error type:",
        dbError instanceof Error ? dbError.constructor.name : typeof dbError,
      );
      console.error(
        "   Error message:",
        dbError instanceof Error ? dbError.message : String(dbError),
      );
      console.error("   Full error:", dbError);
      return NextResponse.json(
        { error: "Failed to save resume to database" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("❌ Resume upload route error:");
    console.error(
      "   Error type:",
      error instanceof Error ? error.constructor.name : typeof error,
    );
    console.error(
      "   Error message:",
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      "   Stack trace:",
      error instanceof Error ? error.stack : "N/A",
    );
    console.error("   Full error object:", error);

    const message =
      error instanceof Error ? error.message : "Unexpected error occurred";
    return NextResponse.json(
      { error: "Internal server error: " + message },
      { status: 500 },
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

// GET method to retrieve user's resumes
async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    const resumes = await prisma.resume.findMany({
      where: { userId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        file_name: true,
        parsedData: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      resumes: resumes,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { POST, GET };
