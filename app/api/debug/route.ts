import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: "Debug endpoint working",
    timestamp: new Date().toISOString(),
    url: req.url,
    method: req.method,
    headers: {
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent")?.substring(0, 50) + "...",
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasJwtSecret: !!process.env.JWT_SECRET,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return NextResponse.json({
      message: "Debug POST endpoint working",
      receivedBody: body,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Debug POST endpoint error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
