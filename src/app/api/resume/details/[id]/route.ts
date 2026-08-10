import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAuth } from "@/lib/auth/requireAuth";
interface interviewParams {
  params: Promise<{
    id: string;
  }>;
}
export async function GET(request: NextRequest, props: interviewParams) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const { userId } = auth;
    const params = await props.params;
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
        { status: 404 },
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
      { status: 500 },
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}
