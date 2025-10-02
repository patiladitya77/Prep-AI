const { NextResponse } = require("next/server");

async function POST() {
  return NextResponse.json(
    {
      success: true,
      message:
        "Logout successful.",
    },
    { status: 200 }
  );
}

module.exports = { POST };
