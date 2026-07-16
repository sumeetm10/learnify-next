import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, courseId } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  if (!/[A-Z]/.test(password)) {
    return NextResponse.json({ error: "Password must contain at least one capital letter" }, { status: 400 });
  }

  const digitCount = (password.match(/\d/g) || []).length;
  if (digitCount < 2) {
    return NextResponse.json({ error: "Password must contain at least 2 numbers" }, { status: 400 });
  }

  if (!courseId) {
    return NextResponse.json({ error: "Please select your course" }, { status: 400 });
  }

  // Validate the course exists
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Invalid course selected" }, { status: 400 });
  }

  // Normalize email so "Foo@x.com" and "foo@x.com" are the same account
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
  }

  // Hash password and create user as STUDENT tied to their course.
  // Email verification is currently disabled (no verified sending domain), so
  // new accounts are auto-verified and can log in immediately. To re-enable:
  // set emailVerified to null here, restore the token + sendVerificationEmail
  // block, and restore the emailVerified check in lib/auth.ts.
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      hashedPassword,
      name: name || null,
      role: "STUDENT",
      courseId,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
