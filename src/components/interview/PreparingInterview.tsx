"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PreparingInterview({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        const res = await fetch(
          `/api/interview/questions?sessionId=${sessionId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();

        if (data.questions && data.questions.length >= 10) {
          clearInterval(interval);
          router.push(`/interview/${sessionId}?status=active`);
        }
      } catch (err) {
        console.error("Error polling questions", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-semibold">Preparing your interview…</h1>
      <p className="text-gray-500 mt-2">
        Analyzing your resume and job description.
      </p>
      <div className="mt-6 animate-pulse">Loading...</div>
    </div>
  );
}
