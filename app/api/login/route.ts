import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key",
);

export async function POST(req: NextRequest) {
  try {
    console.log("Login API called");
    const body = await req.json();
    const { email, password } = body;
    console.log("Login attempt for email:", email);

    if (!email || !password) {
      console.log("Missing email or password");
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("User not found for email:", email);
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
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
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      initials,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d") // 1 day
      .sign(JWT_SECRET);

    const userResponse = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      initials,
    };

    console.log(
      "Login successful for user:",
      email,
      "User data:",
      userResponse,
    );

    // 🥠 Set cookie and return response
    const responseData = {
      success: true,
      token,
      user: userResponse,
    };

    console.log("Sending response:", responseData);

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
