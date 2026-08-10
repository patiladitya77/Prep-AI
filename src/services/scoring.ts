import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Shared rate limiter — single instance across all imports
export const apiCallTracker = {
  calls: [] as number[],
  maxCallsPerMinute: 8,

  canMakeCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter((t) => t > now - 60_000);
    return this.calls.length < this.maxCallsPerMinute;
  },

  recordCall(): void {
    this.calls.push(Date.now());
  },
};

export interface ScoreResult {
  score: number;
  feedback: string;
  strengths: string;
  improvements: string;
}

export function getFallbackScore(answer: string): ScoreResult {
  const len = answer.trim().length;
  const words = answer.trim().split(/\s+/).length;

  if (len < 10)
    return {
      score: 1,
      feedback: "Very brief response. Consider providing more detail.",
      strengths: "Response was submitted successfully.",
      improvements:
        "Expand your answer with specific examples and explanations.",
    };
  if (len < 50 || words < 10)
    return {
      score: 3,
      feedback: "Short response with limited detail.",
      strengths: "Response was submitted successfully.",
      improvements: "Add more specific examples and elaborate on key points.",
    };
  if (len < 150 || words < 25)
    return {
      score: 5,
      feedback: "Moderate response length with basic coverage.",
      strengths: "Provided a reasonable amount of detail.",
      improvements:
        "Consider adding specific examples and more comprehensive explanations.",
    };
  if (len < 300 || words < 50)
    return {
      score: 7,
      feedback: "Well-developed response with good detail.",
      strengths: "Comprehensive answer with good structure.",
      improvements: "Continue providing detailed, well-structured responses.",
    };

  return {
    score: 8,
    feedback: "Detailed and comprehensive response.",
    strengths: "Thorough and well-elaborated answer.",
    improvements: "Maintain this level of detail and specificity.",
  };
}

export async function generateFeedbackAndScore(
  questionText: string,
  answer: string,
  session: any,
): Promise<ScoreResult> {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ Gemini API not configured, using fallback scoring");
    return getFallbackScore(answer);
  }

  if (!apiCallTracker.canMakeCall()) {
    console.warn("⚠️ API rate limit reached, using fallback scoring");
    return getFallbackScore(answer);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let contextInfo = "";
    if (session.jd?.parsedData) {
      contextInfo += `Job Role: ${session.jd.parsedData.jobRole || "N/A"}\n`;
      contextInfo += `Experience Level: ${session.jd.parsedData.experienceLevel || "N/A"} years\n`;
      contextInfo += `Required Skills: ${
        session.jd.parsedData.skills?.join(", ") ?? "N/A"
      }\n`;
    }
    if (session.resume?.parsedData) {
      const r = session.resume.parsedData;
      contextInfo += `Candidate Skills: ${
        Array.isArray(r.skills) ? r.skills.join(", ") : "N/A"
      }\n`;
      contextInfo += `Candidate Experience: ${
        Array.isArray(r.experience)
          ? r.experience
              .map((e: any) => `${e.position} at ${e.company}`)
              .join("; ")
          : "N/A"
      }\n`;
    }

    const prompt = `
You are an expert interviewer evaluating a candidate's response. Provide a detailed assessment.

CONTEXT:
${contextInfo}

QUESTION: ${questionText}

CANDIDATE'S ANSWER: ${answer}

Respond with a JSON object:
{
  "score": <number 1-10>,
  "feedback": "<detailed feedback>",
  "strengths": "<what the candidate did well>",
  "improvements": "<specific areas for improvement>"
}

SCORING CRITERIA:
1-2: Completely irrelevant or no meaningful content
3-4: Very poor answer, major gaps in understanding
5-6: Below average, some relevant points but lacks depth
7-8: Good answer with solid understanding and relevant details
9-10: Excellent answer demonstrating deep knowledge and clear communication

Be strict. Short, generic, or irrelevant answers should score 1-3.
Only return the JSON object, no additional text.
    `.trim();

    apiCallTracker.recordCall();

    const result = await Promise.race<any>([
      model.generateContent(prompt),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API timeout")), 15_000),
      ),
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const evaluation = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(1, Math.min(10, evaluation.score)),
        feedback: evaluation.feedback || "No specific feedback provided.",
        strengths: evaluation.strengths || "No specific strengths identified.",
        improvements:
          evaluation.improvements || "No specific improvements suggested.",
      };
    }

    // JSON not found — length-based fallback
    const len = answer.trim().length;
    return {
      score: len < 10 ? 2 : len < 50 ? 4 : 6,
      feedback:
        "Unable to generate detailed AI feedback. Score based on answer length.",
      strengths: "Response was submitted successfully.",
      improvements:
        "Provide more detailed and relevant answers to demonstrate your knowledge.",
    };
  } catch (error) {
    console.error("❌ Error generating AI feedback:", error);
    if (error instanceof Error) {
      if (error.message.includes("quota") || (error as any).status === 429)
        console.warn("⚠️ API quota exceeded, using fallback scoring");
      else if (error.message.includes("timeout"))
        console.warn("⚠️ API timeout, using fallback scoring");
    }
    return getFallbackScore(answer);
  }
}

export function isJsonObject(data: unknown): data is Record<string, any> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

export function getGrade(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 8) return "Good";
  if (score >= 7) return "Average";
  if (score >= 6) return "Below Average";
  return "Needs Improvement";
}

export function generateOverallFeedback(
  score: number,
  completion: number,
): string {
  const grade = getGrade(score);
  let feedback = `You completed ${completion.toFixed(0)}% of the interview with an overall score of ${score.toFixed(1)}/10 (${grade}). `;

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
