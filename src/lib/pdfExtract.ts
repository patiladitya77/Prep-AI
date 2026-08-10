import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Extracts plain text from a PDF buffer using Gemini multimodal.
 * - upload/route: returns a fallback string on failure (never throws)
 * - analyze/route: throws on failure so the caller can 400
 * Pass `throwOnError = true` for the strict (analyze) behaviour.
 */
export async function extractTextFromPDF(
  buffer: Buffer,
  throwOnError = false,
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Please extract all text content from this PDF document. 
Return only the plain text content, maintaining the structure and formatting as much as possible.
This appears to be a resume/CV document.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "application/pdf",
          data: buffer.toString("base64"),
        },
      },
    ]);

    return result.response.text();
  } catch (error) {
    console.error("❌ PDF text extraction failed:", error);
    if (throwOnError)
      throw new Error("Failed to extract text from PDF using AI");
    return "PDF content extraction failed - proceeding with filename analysis";
  }
}
