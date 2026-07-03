import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, password, courseId } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
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

  // Hash password and create user as STUDENT tied to their course
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

  return NextResponse.json({ success: true });
}
