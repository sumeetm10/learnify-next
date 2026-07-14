import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/email";

// Re-send a verification email. Always returns success (don't leak whether an
// email is registered), but only actually sends for existing unverified users.
export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (user && !user.emailVerified) {
    await prisma.verificationToken.deleteMany({ where: { email: normalizedEmail } });
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await prisma.verificationToken.create({
      data: { email: normalizedEmail, token, expires },
    });
    try {
      await sendVerificationEmail(normalizedEmail, token, user.name);
    } catch {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
