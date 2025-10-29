const { NextResponse } = require("next/server");
const { PrismaClient } = require("@prisma/client");
const { generateToken, excludePassword } = require("@/lib/auth/helpers");
const crypto = require("crypto");
const { hashPassword } = require("@/lib/auth/helpers");

const prisma = new PrismaClient();

async function GET(request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { success: false, message: "Missing code from Google" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.BASE_URL ||
      "http://localhost:3000";
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.id_token) {
      console.error("Google token exchange failed", tokenData);
      return NextResponse.json(
        { success: false, message: "Google authentication failed" },
        { status: 400 }
      );
    }

    // Decode JWT without verifying (we'll trust Google for now)
    const base64Url = tokenData.id_token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(Buffer.from(base64, "base64").toString("utf8"));

    const email = decoded.email;
    const name = decoded.name || decoded.email.split("@")[0];

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Google account has no email" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      // Create user with random password
      const randomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await hashPassword(randomPassword);
      user = await prisma.user.create({
        data: { email: email.toLowerCase(), name: name, passwordHash },
      });
    }

    const token = generateToken(user.id);

    // Redirect back to client with token as fragment (so it isn't sent to server)
    const clientRedirect = `${baseUrl}/home/dashboard#token=${token}`;
    return NextResponse.redirect(clientRedirect);
  } catch (error) {
    console.error("Google callback error", error);
    return NextResponse.json(
      { success: false, message: "Authentication failed" },
      { status: 500 }
    );
  } finally {
    // keep Prisma client alive across requests in dev/server mode
  }
}

module.exports = { GET };
