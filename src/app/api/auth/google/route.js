
import { NextResponse } from "next/server";

// Start Google OAuth2 flow by redirecting to Google's consent screen
function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  if (!clientId) {
    console.error("Missing GOOGLE_CLIENT_ID environment variable");
    return NextResponse.json(
      { success: false, message: "Server not configured for Google sign-in" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(authUrl);
}

module.exports = { GET };
