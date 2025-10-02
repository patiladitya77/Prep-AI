import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

// Temporary storage reference (shared with answer route)
const temporaryScores = new Map();
const temporaryAnswers = new Map();

export async function POST(request) {
  try {
    const { sessionId } = await request.json();

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
        jobRole: session.jd?.parsedData?.jobRole || "Software Developer",
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

function getGrade(score) {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Good";
  if (score >= 7) return "Average";
  if (score >= 6) return "Below Average";
  return "Needs Improvement";
}

function generateOverallFeedback(score, completion) {
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

async function generateFeedbackAndScore(questionText, answer, session) {
  try {
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
              .map((exp) => `${exp.position} at ${exp.company}`)
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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);

      // Ensure score is within valid range
      evaluation.score = Math.max(1, Math.min(10, evaluation.score));

      return {
        score: evaluation.score,
        feedback: evaluation.feedback || "No specific feedback provided.",
        strengths: evaluation.strengths || "No specific strengths identified.",
        improvements:
          evaluation.improvements || "No specific improvements suggested.",
      };
    } else {
      // Fallback if JSON parsing fails - give a low score for poor answers
      const answerLength = answer.trim().length;
      const fallbackScore = answerLength < 10 ? 1 : answerLength < 50 ? 2 : 5;

      return {
        score: fallbackScore,
        feedback:
          "Unable to generate detailed feedback due to system limitations.",
        strengths: "Response was submitted successfully.",
        improvements:
          "Try to provide more detailed and relevant answers to demonstrate your knowledge.",
      };
    }
  } catch (error) {
    console.error("❌ Error generating AI feedback:", error);

    // Fallback scoring based on answer quality indicators
    const answerLength = answer.trim().length;
    let fallbackScore = 1;

    if (answerLength < 10) {
      fallbackScore = 1;
    } else if (answerLength < 30) {
      fallbackScore = 2;
    } else if (answerLength < 100) {
      fallbackScore = 4;
    } else {
      fallbackScore = 6;
    }

    return {
      score: fallbackScore,
      feedback:
        "System error occurred during evaluation. Score based on response length and basic criteria.",
      strengths: "Response was provided within the time limit.",
      improvements:
        "Due to system limitations, detailed feedback is not available. Focus on providing comprehensive, relevant answers.",
    };
  }
}
