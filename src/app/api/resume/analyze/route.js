import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

// Initialize Gemini AI and Prisma
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const prisma = new PrismaClient();

// Function to extract text from PDF using Gemini Vision API
async function extractTextFromPDFWithAI(buffer) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
      Please extract all text content from this PDF document. 
      Return only the plain text content, maintaining the structure and formatting as much as possible.
      This appears to be a resume/CV document.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
    ]);

    const extractedText = result.response.text();
    console.log(
      "📄 PDF text extracted, length:",
      extractedText.length,
      "chars"
    );
    return extractedText;
  } catch (error) {
    console.error("PDF AI extraction error:", error);
    throw new Error("Failed to extract text from PDF using AI");
  }
}

export async function POST(request) {
  try {
    // Check authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Check user's resume analysis usage limits
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get usage limits based on user type
    const resumeLimit = user.isPremium ? 100 : 10;
    const resumesUsed = user.resumeChecks || 0;

    // Check if user has reached their resume check limit
    if (resumesUsed >= resumeLimit) {
      return NextResponse.json(
        { 
          error: "Resume check limit reached",
          message: user.isPremium 
            ? "You have exhausted your premium resume check limit"
            : "You have reached your resume check limit. Please upgrade to continue.",
          limitReached: true,
          used: resumesUsed,
          limit: resumeLimit
        },
        { status: 403 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const resumeFile = formData.get("resume");
    const jobDescription = formData.get("jobDescription");

    // Validate that a resume file was provided
    if (!resumeFile) {
      return NextResponse.json(
        { error: "Resume file is required" },
        { status: 400 }
      );
    }

    // Handle text input vs PDF input
    if (resumeFile.name === "resume.txt") {
      // It's a text input - we'll handle this case with plain text analysis
      const resumeText = await resumeFile.text();

      if (!resumeText.trim()) {
        return NextResponse.json(
          { error: "Resume text cannot be empty" },
          { status: 400 }
        );
      }

      // Prepare prompt for text-based analysis
      const textAnalysisPrompt = `
You are an expert resume reviewer and career advisor. Please analyze the following resume text and provide a comprehensive evaluation.

RESUME TEXT:
${resumeText}

${
  jobDescription
    ? `JOB DESCRIPTION (for targeted analysis):
${jobDescription}

Focus on how well the resume matches the provided job description, including relevant skills, experience, and keywords.`
    : `Provide general resume improvement advice focusing on content quality and professional presentation.`
}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": [number from 0-100],
  "strengths": [array of specific strengths found in the resume],
  "weaknesses": [array of areas that need improvement],
  "suggestions": [array of actionable suggestions for improvement],
  "detailedAnalysis": {
    "formatting": [score 0-100 for resume formatting and structure],
    "content": [score 0-100 for content quality and relevance],
    "skills": [score 0-100 for skills presentation and relevance],
    "experience": [score 0-100 for work experience presentation],
    "keywords": [score 0-100 for industry-relevant keywords]
  }
}

Please ensure all scores are realistic and constructive. Provide specific, actionable feedback.
`;

      try {
        // Use the stable Gemini Pro model
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(textAnalysisPrompt);
        const responseText = result.response.text();

        // Parse and return the analysis
        let analysis;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          analysis = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", responseText);
          return NextResponse.json(
            { error: "Failed to parse AI response. Please try again." },
            { status: 500 }
          );
        }

        // Ensure scores are within valid range
        analysis.overallScore = Math.max(
          0,
          Math.min(100, analysis.overallScore)
        );
        Object.keys(analysis.detailedAnalysis).forEach((key) => {
          analysis.detailedAnalysis[key] = Math.max(
            0,
            Math.min(100, analysis.detailedAnalysis[key])
          );
        });

        // Store the text analysis in the database
        try {
          await prisma.resumeAnalysis.create({
            data: {
              userId: decoded.userId,
              fileName: "text_resume_analysis.txt",
              analysisType: "TEXT",
              overallScore: analysis.overallScore,
              detailedScores: analysis.detailedAnalysis,
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              suggestions: analysis.suggestions,
              extractedText: resumeText.substring(0, 2000),
              jobDescription: jobDescription || null,
            },
          });

          // Increment user's resume check count
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              resumeChecks: {
                increment: 1,
              },
            },
          });
        } catch (dbError) {
          console.error("Text Database storage error:", dbError);
        }

        return NextResponse.json({
          success: true,
          analysis: analysis,
          message: "Text Resume analyzed successfully",
        });
      } catch (aiError) {
        console.error("Gemini AI Error:", aiError);
        return NextResponse.json(
          {
            error:
              "AI analysis service temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }
    } else {
      // Handle PDF input with Gemini multimodal
      // Validate file type for PDF
      if (resumeFile.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are supported" },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      if (resumeFile.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size must be less than 10MB" },
          { status: 400 }
        );
      }

      // Convert file to buffer for AI-based PDF text extraction
      const buffer = await resumeFile.arrayBuffer();

      // Extract text from PDF using Gemini AI
      let resumeText;
      try {
        resumeText = await extractTextFromPDFWithAI(Buffer.from(buffer));
      } catch (pdfError) {
        console.error("PDF AI extraction error:", pdfError);
        return NextResponse.json(
          {
            error:
              "Failed to extract text from PDF using AI. Please ensure the PDF contains readable text.",
          },
          { status: 400 }
        );
      }

      if (!resumeText.trim()) {
        return NextResponse.json(
          {
            error:
              "No text could be extracted from the PDF. Please ensure your resume contains readable text.",
          },
          { status: 400 }
        );
      }

      // Prepare the analysis prompt for PDF content
      const pdfAnalysisPrompt = `
You are an expert resume reviewer and career advisor. Please analyze the following resume text (extracted from PDF) and provide a comprehensive evaluation.

RESUME TEXT:
${resumeText}

${
  jobDescription
    ? `JOB DESCRIPTION (for targeted analysis):
${jobDescription}

Focus on how well the resume matches the provided job description, including relevant skills, experience, and keywords.`
    : `Provide general resume improvement advice focusing on content quality and professional presentation.`
}
}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": [number from 0-100],
  "strengths": [array of specific strengths found in the resume],
  "weaknesses": [array of areas that need improvement],
  "suggestions": [array of actionable suggestions for improvement],
  "detailedAnalysis": {
    "formatting": [score 0-100 for resume formatting and structure],
    "content": [score 0-100 for content quality and relevance],
    "skills": [score 0-100 for skills presentation and relevance],
    "experience": [score 0-100 for work experience presentation],
    "keywords": [score 0-100 for industry-relevant keywords]
  }
}

Evaluation Criteria:
1. Overall Score: Comprehensive assessment based on all factors
2. Strengths: Specific positive aspects (3-5 items)
3. Weaknesses: Areas needing improvement (3-5 items)  
4. Suggestions: Actionable advice for enhancement (5-7 items)
5. Detailed Analysis: Scores for specific categories

Please ensure all scores are realistic and constructive. Provide specific, actionable feedback that the candidate can implement.
`;

      try {
        // Use the stable Gemini Pro model for PDF analysis
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        // Generate content using text analysis (since we extracted text from PDF)
        const result = await model.generateContent(pdfAnalysisPrompt);

        const responseText = result.response.text();

        // Parse and return the analysis
        let analysis;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in response");
          }
          analysis = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse Gemini response:", responseText);
          return NextResponse.json(
            { error: "Failed to parse AI response. Please try again." },
            { status: 500 }
          );
        }

        // Ensure scores are within valid range for PDF
        analysis.overallScore = Math.max(
          0,
          Math.min(100, analysis.overallScore)
        );
        Object.keys(analysis.detailedAnalysis).forEach((key) => {
          analysis.detailedAnalysis[key] = Math.max(
            0,
            Math.min(100, analysis.detailedAnalysis[key])
          );
        });

        // Store the PDF analysis in the database
        try {
          await prisma.resumeAnalysis.create({
            data: {
              userId: decoded.userId,
              fileName: resumeFile.name || "analyzed_resume.pdf",
              analysisType: "PDF",
              overallScore: analysis.overallScore,
              detailedScores: analysis.detailedAnalysis,
              strengths: analysis.strengths,
              weaknesses: analysis.weaknesses,
              suggestions: analysis.suggestions,
              extractedText: resumeText.substring(0, 2000),
              jobDescription: jobDescription || null,
            },
          });

          // Increment user's resume check count
          await prisma.user.update({
            where: { id: decoded.userId },
            data: {
              resumeChecks: {
                increment: 1,
              },
            },
          });
        } catch (dbError) {
          console.error("PDF Database storage error:", dbError);
        }

        return NextResponse.json({
          success: true,
          analysis: analysis,
          message: "PDF Resume analyzed successfully",
        });
      } catch (aiError) {
        console.error("Gemini AI Error:", aiError);
        return NextResponse.json(
          {
            error:
              "AI analysis service temporarily unavailable. Please try again later.",
          },
          { status: 503 }
        );
      }
    }
  } catch (error) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}
