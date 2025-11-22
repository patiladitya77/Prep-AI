// speech-to-text endpoint intentionally disabled in this branch.
// Returning 404 to prevent any placeholder transcriptions from being consumed by the client.

export async function POST() {
  return new Response(
    JSON.stringify({ error: "speech-to-text not configured" }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }
  );
}
