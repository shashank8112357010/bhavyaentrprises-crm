import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAgentSchema } from "@/lib/validations/agentSchema";
import { sendMail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { role } = jwt.verify(token, process.env.JWT_SECRET!) as {
    role: string;
  };
  if (role !== "ADMIN") {
    return NextResponse.json({ message: "Need Admin Access" }, { status: 403 });
  }

  const body = await req.json();
  // ✅ Validate input
  const validation = createAgentSchema.safeParse(body);
  if (validation.error) {
    const fieldErrors = validation.error.flatten().fieldErrors;
    const firstFieldKey = Object.keys(fieldErrors)[0];
    const firstErrorMessage =
      firstFieldKey &&
      fieldErrors[firstFieldKey as keyof typeof fieldErrors]?.[0];

    return NextResponse.json(
      { message: `${firstFieldKey}: ${firstErrorMessage}` },
      { status: 400 },
    );
  }

  const { name, email, mobile, role: userRole } = validation.data;

  const existingUserEmail = await prisma.user.findUnique({ where: { email } });
  if (existingUserEmail) {
    return NextResponse.json(
      { message: "User with this email already exists" },
      { status: 409 },
    );
  }

  const existingUserMobile = await prisma.user.findUnique({
    where: { mobile },
  });
  if (existingUserMobile) {
    return NextResponse.json(
      { message: "User with this phone no  already exists" },
      { status: 409 },
    );
  }

  // Generate custom agent display ID
  let customDisplayId;
  try {
    const latestAgent = await prisma.user.findFirst({
      where: { displayId: { not: null } },
      orderBy: { createdAt: "desc" },
      select: { displayId: true },
    });

    let agentNumber = 1;
    if (latestAgent && latestAgent.displayId) {
      // Extract number from existing agent displayId (format: AGENT-0001)
      const idMatch = latestAgent.displayId.match(/AGENT-(\d+)$/);
      if (idMatch) {
        agentNumber = parseInt(idMatch[1]) + 1;
      }
    }

    customDisplayId = `AGENT-${agentNumber.toString().padStart(4, "0")}`;
  } catch (idError) {
    console.error("Error generating agent display ID:", idError);
  }

  const rawPassword = "welcome@crm";
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      displayId: customDisplayId,
      initials: name
        .split(" ")
        .map((n: any) => n[0])
        .join(""),
      mobile,
      password: hashedPassword,
      role: userRole,
    },
  });

  sendMail({
    to: email,
    subject: "Your Account Is Ready",
    text: `Hello ${name},\n\nYour account has been created.\nLogin credentials:\nEmail: ${email}\nPassword: ${rawPassword}\n\nPlease change your password after logging in.`,
  });

  return NextResponse.json({ message: "User created and email sent", user });
}
