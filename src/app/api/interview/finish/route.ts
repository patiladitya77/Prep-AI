import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { prisma } from "../../../../lib/prisma";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const JWT_SECRET = process.env.JWT_SECRET!;

//helper
function isJsonObject(data: unknown): data is Record<string, any> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

// Temporary storage reference (shared with answer route)
const temporaryScores = new Map();
const temporaryAnswers = new Map();

// Rate limiting for Gemini API
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
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (jsonError) {
      console.error("❌ JSON parsing error in request body:", jsonError);
      return NextResponse.json(
        { error: "Invalid request body format" },
        { status: 400 }
      );
    }

    const { sessionId } = requestBody;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
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

    let finalResults;
    let usedFallback = false;

    try {
      // Get session with all answers and questions from database
      const session = await prisma.interviewSession.findUnique({
        where: { id: sessionId },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
          questions: {
            orderBy: { order: "asc" },
          },
          jd: true,
        },
      });

      if (!session || session.userId !== userId) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }

      const totalQuestions = session.questions.length;
      const answeredQuestions = session.answers.length;

      if (answeredQuestions === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No answers found for this session",
          },
          { status: 400 }
        );
      }

      // Calculate individual question scores using AI
      const questionResults = [];

      for (const question of session.questions) {
        const answer = session.answers.find(
          (a) => a.questionId === question.id
        );

        if (answer) {
          // Generate AI-powered feedback and score
          const aiResult = await generateFeedbackAndScore(
            question.questionText,
            answer.candidateAnswer,
            session
          );

          // Store the score back to database
          await prisma.answer.update({
            where: { id: answer.id },
            data: {
              score: aiResult.score,
              feedback: aiResult.feedback,
              strengths: aiResult.strengths,
              improvements: aiResult.improvements,
            },
          });

          questionResults.push({
            questionId: question.id,
            questionText: question.questionText,
            answer: answer.candidateAnswer,
            score: aiResult.score,
            feedback: aiResult.feedback,
            strengths: aiResult.strengths,
            improvements: aiResult.improvements,
            submittedAt: answer.submittedAt,
          });
        }
      }

      // Calculate overall score
      const totalScore = questionResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      const averageScore = totalScore / questionResults.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      // Update session as completed
      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          score: averageScore,
          endedAt: new Date(),
          feedback: generateOverallFeedback(averageScore, completionPercentage),
        },
      });
      const jdRaw = session.jd?.parsedData;

      const jdData = isJsonObject(jdRaw) ? (jdRaw as Record<string, any>) : {};

      finalResults = {
        sessionId,
        totalQuestions,
        answeredQuestions,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        overallScore: parseFloat(averageScore.toFixed(1)),
        grade: getGrade(averageScore),
        questionResults,
        overallFeedback: generateOverallFeedback(
          averageScore,
          completionPercentage
        ),
        jobRole: jdData.jobRole ?? "Software Developer",

        completedAt: new Date().toISOString(),
      };
    } catch (dbError) {
      console.error(
        "❌ Database unavailable, using fallback calculation:",
        dbError
      );

      // Calculate from temporary storage
      const sessionAnswers = Array.from(temporaryAnswers.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryAnswers.get(key));

      const sessionScores = Array.from(temporaryScores.keys())
        .filter((key) => key.startsWith(sessionId))
        .map((key) => temporaryScores.get(key));

      if (sessionAnswers.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "No answers found for this session",
          },
          { status: 400 }
        );
      }

      const totalQuestions = 10;
      const answeredQuestions = sessionAnswers.length;
      const completionPercentage = (answeredQuestions / totalQuestions) * 100;

      // Generate mock results for fallback
      const questionResults = sessionAnswers.map((answer, index) => {
        const score =
          sessionScores.find((s) => s.questionId === answer.questionId)
            ?.score || Math.floor(Math.random() * 4) + 6;

        return {
          questionId: answer.questionId,
          questionText: `Interview Question ${index + 1}`,
          answer: answer.candidateAnswer,
          score: score,
          feedback: `Answer recorded with score ${score}/10 (temporary storage)`,
          submittedAt: answer.submittedAt,
        };
      });

      const totalScore = questionResults.reduce(
        (sum, result) => sum + result.score,
        0
      );
      const averageScore = totalScore / questionResults.length;

      finalResults = {
        sessionId,
        totalQuestions,
        answeredQuestions,
        completionPercentage: parseFloat(completionPercentage.toFixed(1)),
        overallScore: parseFloat(averageScore.toFixed(1)),
        grade: getGrade(averageScore),
        questionResults,
        overallFeedback:
          generateOverallFeedback(averageScore, completionPercentage) +
          " (Demo mode - results not saved)",
        jobRole: "Software Developer",
        completedAt: new Date().toISOString(),
        fallbackMode: true,
      };

      usedFallback = true;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...finalResults,
        fallbackMode: usedFallback,
      },
    });
  } catch (error) {
    console.error("❌ Error finishing interview:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getGrade(score: number) {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Good";
  if (score >= 7) return "Average";
  if (score >= 6) return "Below Average";
  return "Needs Improvement";
}

function generateOverallFeedback(score: number, completion: number) {
  const grade = getGrade(score);
  let feedback = `You completed ${completion.toFixed(
    0
  )}% of the interview with an overall score of ${score.toFixed(
    1
  )}/10 (${grade}). `;

  if (score >= 8) {
    feedback +=
      "Excellent performance! You demonstrated strong knowledge and communication skills.";
  } else if (score >= 7) {
    feedback +=
      "Good job! You showed solid understanding with room for some improvement.";
  } else if (score >= 6) {
    feedback +=
      "Decent performance. Focus on providing more detailed and specific answers.";
  } else {
    feedback +=
      "There's room for improvement. Practice more and focus on giving comprehensive answers.";
  }

  return feedback;
}

function getFallbackScore(answer: string) {
  const answerLength = answer.trim().length;
  const wordCount = answer.trim().split(/\s+/).length;

  let score = 1;
  let feedback = "System evaluation based on response characteristics.";
  let strengths = "Response was submitted successfully.";
  let improvements = "Focus on providing detailed, relevant answers.";

  // Basic scoring logic based on length and word count
  if (answerLength < 10) {
    score = 1;
    feedback = "Very brief response. Consider providing more detail.";
    improvements =
      "Expand your answer with specific examples and explanations.";
  } else if (answerLength < 50 || wordCount < 10) {
    score = 3;
    feedback = "Short response with limited detail.";
    improvements = "Add more specific examples and elaborate on key points.";
  } else if (answerLength < 150 || wordCount < 25) {
    score = 5;
    feedback = "Moderate response length with basic coverage.";
    strengths = "Provided a reasonable amount of detail.";
    improvements =
      "Consider adding specific examples and more comprehensive explanations.";
  } else if (answerLength < 300 || wordCount < 50) {
    score = 7;
    feedback = "Well-developed response with good detail.";
    strengths = "Comprehensive answer with good structure.";
    improvements = "Continue providing detailed, well-structured responses.";
  } else {
    score = 8;
    feedback = "Detailed and comprehensive response.";
    strengths = "Thorough and well-elaborated answer.";
    improvements = "Maintain this level of detail and specificity.";
  }

  return {
    score,
    feedback,
    strengths,
    improvements,
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Get context about the job and candidate
    let contextInfo = "";
    if (session.jd && session.jd.parsedData) {
      contextInfo += `Job Role: ${session.jd.parsedData.jobRole || "N/A"}\n`;
      contextInfo += `Experience Level: ${
        session.jd.parsedData.experienceLevel || "N/A"
      } years\n`;
      contextInfo += `Required Skills: ${
        session.jd.parsedData.skills
          ? session.jd.parsedData.skills.join(", ")
          : "N/A"
      }\n`;
    }

    if (session.resume && session.resume.parsedData) {
      const resumeData = session.resume.parsedData;
      contextInfo += `Candidate Skills: ${
        Array.isArray(resumeData.skills) ? resumeData.skills.join(", ") : "N/A"
      }\n`;
      contextInfo += `Candidate Experience: ${
        Array.isArray(resumeData.experience)
          ? resumeData.experience
              .map((exp: any) => `${exp.position} at ${exp.company}`)
              .join("; ")
          : "N/A"
      }\n`;
    }

    const prompt = `
    You are an expert interviewer evaluating a candidate's response. Please provide a detailed assessment.

    CONTEXT:
    ${contextInfo}

    QUESTION: ${questionText}

    CANDIDATE'S ANSWER: ${answer}

    Please evaluate this answer and respond with a JSON object containing:
    {
      "score": <number from 1-10>,
      "feedback": "<detailed feedback about the answer>",
      "strengths": "<what the candidate did well>",
      "improvements": "<specific areas for improvement>"
    }

    SCORING CRITERIA:
    1-2: Completely irrelevant, nonsensical, or no meaningful content
    3-4: Very poor answer, major gaps in understanding
    5-6: Below average, some relevant points but lacks depth
    7-8: Good answer with solid understanding and relevant details
    9-10: Excellent answer demonstrating deep knowledge and clear communication

    Be strict with scoring. Short, generic, or irrelevant answers should score 1-3. Only well-thought-out, detailed, and relevant answers should score 7+.

    Provide constructive feedback that helps the candidate improve.
    `;

    // Record the API call for rate limiting
    apiCallTracker.recordCall();

    // Add timeout and retry logic for API calls
    const result = await Promise.race<any>([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API timeout")), 15000)
      ),
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const evaluation = JSON.parse(jsonMatch[0]);

        // Ensure score is within valid range
        evaluation.score = Math.max(1, Math.min(10, evaluation.score));

        return {
          score: evaluation.score,
          feedback: evaluation.feedback || "No specific feedback provided.",
          strengths:
            evaluation.strengths || "No specific strengths identified.",
          improvements:
            evaluation.improvements || "No specific improvements suggested.",
        };
      } catch (parseError) {
        console.error("❌ JSON parsing error:", parseError);
        // Fall through to fallback logic
      }
    }

    // Fallback if JSON parsing fails - give a reasonable score
    const answerLength = answer.trim().length;
    const fallbackScore = answerLength < 10 ? 2 : answerLength < 50 ? 4 : 6;

    return {
      score: fallbackScore,
      feedback:
        "Unable to generate detailed AI feedback. Score based on answer length and relevance.",
      strengths: "Response was submitted successfully.",
      improvements:
        "Try to provide more detailed and relevant answers to demonstrate your knowledge.",
    };
  } catch (error) {
    console.error("❌ Error generating AI feedback:", error);

    if (error instanceof Error) {
      if (error.message.includes("quota") || (error as any).status === 429) {
        console.warn("⚠️ API quota exceeded, using fallback scoring");
      } else if (error.message.includes("timeout")) {
        console.warn("⚠️ API timeout, using fallback scoring");
      }
    }

    return getFallbackScore(answer);
  }
}
