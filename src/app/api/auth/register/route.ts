import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

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
  // emailVerified stays null — they must confirm via the email link before login.
  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      hashedPassword,
      name: name || null,
      role: "STUDENT",
      courseId,
    },
  });

  // Create a one-time verification token (valid 24h) and email the link.
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({
    data: { email: normalizedEmail, token, expires },
  });

  try {
    await sendVerificationEmail(normalizedEmail, token, name || null);
  } catch {
    // Don't fail registration if the email send hiccups — user can resend.
    return NextResponse.json({
      success: true,
      emailSent: false,
      message: "Account created, but the verification email failed to send. Try resending.",
    });
  }

  return NextResponse.json({ success: true, emailSent: true });
}
