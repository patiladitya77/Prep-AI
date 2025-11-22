import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { prisma } from "../../../../lib/prisma";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const JWT_SECRET = process.env.JWT_SECRET!;

// In-memory storage for answers when database is unavailable
const temporaryAnswers = new Map();
const temporaryScores = new Map();

// Rate limiting for Gemini API (shared with finish route)
const apiCallTracker = {
  calls: [] as number[],
  maxCallsPerMinute: 8, // Stay under the 10 call/minute limit

  canMakeCall() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove calls older than 1 minute
    this.calls = this.calls.filter((timestamp) => timestamp > oneMinuteAgo);

    return this.calls.length < this.maxCallsPerMinute;
  },

  recordCall() {
    this.calls.push(Date.now());
  },
};

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { sessionId, questionId, answer } = await request.json();

    // Validate required fields
    if (!sessionId || !questionId || !answer) {
      return NextResponse.json(
        { error: "Session ID, Question ID, and answer are required" },
        { status: 400 }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    //for type safety
    if (typeof decoded === "string" || !("userId" in decoded)) {
      return NextResponse.json(
        { success: false, message: "Invalid token payload" },
        { status: 401 }
      );
    }
    const userId = decoded.userId;

    // Try database first, fallback to temporary storage if database is unavailable
    let savedAnswer;
    let usedFallback = false;
    let questionText = "Interview question";
    let sessionContext = null;

    try {
      // Try to save to database
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          questions: true,
          user: true,
          jd: true,
          resume: true,
        },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }

      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });

      if (!question || question.sessionId !== sessionId) {
        return NextResponse.json(
          { error: "Question not found in this session" },
          { status: 404 }
        );
      }

      questionText = question.questionText;
      sessionContext = session;

      // Check if answer already exists
      const existingAnswer = await prisma.answer.findFirst({
        where: {
          sessionId: sessionId,
          questionId: questionId,
        },
      });

      if (existingAnswer) {
        savedAnswer = await prisma.answer.update({
          where: { id: existingAnswer.id },
          data: {
            candidateAnswer: answer,
            submittedAt: new Date(),
          },
        });
      } else {
        savedAnswer = await prisma.answer.create({
          data: {
            sessionId: sessionId,
            questionId: questionId,
            candidateAnswer: answer,
          },
        });
      }
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback storage:",
        dbError
      );
      // Use temporary storage as fallback
      const answerId = `${sessionId}_${questionId}`;
      savedAnswer = {
        id: answerId,
        sessionId,
        questionId,
        candidateAnswer: answer,
        submittedAt: new Date().toISOString(),
      };

      temporaryAnswers.set(answerId, savedAnswer);
      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      message: `Answer saved successfully ${
        usedFallback ? "(using temporary storage)" : ""
      }`,
      data: {
        answerId: savedAnswer.id,
        submittedAt: savedAnswer.submittedAt,
        fallbackMode: usedFallback,
      },
    });
  } catch (error) {
    console.error("❌ Error saving answer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Fallback scoring function for when API is unavailable
function getFallbackScore(answer: string) {
  const answerLength = answer.trim().length;
  const wordCount = answer.trim().split(/\s+/).length;

  let score = 3; // Default reasonable score

  if (answerLength < 10) {
    score = 1;
  } else if (answerLength < 50 || wordCount < 10) {
    score = 3;
  } else if (answerLength < 150 || wordCount < 25) {
    score = 5;
  } else if (answerLength < 300 || wordCount < 50) {
    score = 7;
  } else {
    score = 8;
  }

  return {
    score,
    feedback:
      "Score calculated based on response characteristics. AI feedback temporarily unavailable.",
    strengths: "Response submitted successfully.",
    improvements: "Focus on providing detailed, relevant answers.",
  };
}

async function generateFeedbackAndScore(
  questionText: string,
  answer: string,
  session: any
) {
  try {
    // Check if Gemini API is available and rate limit
    if (!genAI || !process.env.GEMINI_API_KEY) {
      console.warn("⚠️ Gemini API not configured, using fallback scoring");
      return getFallbackScore(answer);
    }

    // Check rate limit before making API call
    if (!apiCallTracker.canMakeCall()) {
      console.warn("⚠️ API rate limit reached, using fallback scoring");
      return getFallbackScore(answer);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Get context about the job and candidate
    let contextInfo = "";
    if (session.jd && session.jd.parsedData) {
      contextInfo += `Job Role: ${session.jd.parsedData.jobRole || "N/A"}\n`;
      contextInfo += `Experience Level: ${
        session.jd.parsedData.experienceLevel || "N/A"
      } years\n`;
    }

    if (session.resume && session.resume.parsedData) {
      const resumeData = session.resume.parsedData;
      contextInfo += `Candidate Skills: ${
        Array.isArray(resumeData.skills) ? resumeData.skills.join(", ") : "N/A"
      }\n`;
      contextInfo += `Candidate Experience: ${
        Array.isArray(resumeData.experience)
          ? resumeData.experience
              .map(
                (exp: { position?: string; company?: string }) =>
                  `${exp.position} at ${exp.company}`
              )
              .join("; ")
          : "N/A"
      }\n`;
    }

    const prompt = `
      You are an expert technical interviewer evaluating a candidate's answer.

      CONTEXT:
      ${contextInfo}

      QUESTION: ${questionText}

      CANDIDATE'S ANSWER: ${answer}

      Please evaluate this answer and provide:
      1. A score from 1-10 (where 10 is excellent, 8-9 is good, 6-7 is average, 4-5 is below average, 1-3 is poor)
      2. Detailed feedback explaining the score
      3. Suggestions for improvement

      Consider:
      - Technical accuracy and depth
      - Clarity of communication
      - Relevance to the question
      - Problem-solving approach
      - Real-world applicability

      Return your response as JSON in this exact format:
      {
        "score": 8.5,
        "feedback": "Your detailed feedback here...",
        "strengths": ["strength 1", "strength 2"],
        "improvements": ["improvement 1", "improvement 2"]
      }

      Only return the JSON object, no additional text.
    `;

    // Record the API call for rate limiting
    apiCallTracker.recordCall();

    // Add timeout for API calls
    const result = await Promise.race([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API timeout")), 10000)
      ),
    ]);
    if (
      typeof result !== "object" ||
      result === null ||
      !("response" in result)
    ) {
      throw new Error("Invalid AI response");
    }
    const response = await (result as any).response;
    const text = response.text();

    // Clean and parse the response
    try {
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      const evaluation = JSON.parse(cleanedText);

      return {
        score: evaluation.score || 5,
        feedback: evaluation.feedback || "Feedback generation incomplete.",
        strengths: evaluation.strengths || ["Response submitted successfully."],
        improvements: evaluation.improvements || [
          "Focus on providing more detailed answers.",
        ],
      };
    } catch (parseError) {
      console.error("❌ JSON parsing error:", parseError);
      return getFallbackScore(answer);
    }
  } catch (error) {
    console.error("❌ Error generating feedback:", error);

    // Handle specific API quota errors
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as any).message === "string"
    ) {
      const err = error as { status?: number; message: string };

      if (err.status === 429 || err.message.includes("quota")) {
        console.warn("⚠️ API quota exceeded, using fallback scoring");
      } else if (err.message.includes("timeout")) {
        console.warn("⚠️ API timeout, using fallback scoring");
      }
    }

    return getFallbackScore(answer);
  }
}
