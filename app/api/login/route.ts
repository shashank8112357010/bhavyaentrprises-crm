import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }



    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const initials =
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() ||
      user.email?.substring(0, 2).toUpperCase() ||
      "NA";

    // 🧾 Create JWT using jose
    let token;
    try {
      token = await new SignJWT({
        userId: user.id,
        email: user.email,
        role: user.role,
        initials,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d") // 1 day
        .sign(JWT_SECRET);

    } catch (jwtError) {
      console.error("JWT creation failed:", jwtError);
      return NextResponse.json(
        { message: "Token creation failed" },
        { status: 500 },
      );
    }
    const userResponse = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      initials,
    };
    // Validate that we have all required data before sending response
    if (!token) {
      console.error("Token generation failed");
      return NextResponse.json(
        { message: "Token generation failed" },
        { status: 500 },
      );
    }

    if (!userResponse.userId || !userResponse.email || !userResponse.role) {
      console.error("User response missing required fields:", userResponse);
      return NextResponse.json(
        { message: "User data incomplete" },
        { status: 500 },
      );
    }

    // 🥠 Set cookie and return response
    const responseData = {
      success: true,
      token,
      user: userResponse,
    };

    const response = NextResponse.json(responseData);

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
