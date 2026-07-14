import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Clicking the email link lands here. We validatfe the token, mark the user
// verified, delete the token, then send them to login with a status flag.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${APP_URL}/login?verify=invalid`);
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record) {
    return NextResponse.redirect(`${APP_URL}/login?verify=invalid`);
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } });
    return NextResponse.redirect(`${APP_URL}/login?verify=expired`);
  }

  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  // Clean up all tokens for this email
  await prisma.verificationToken.deleteMany({ where: { email: record.email } });

  return NextResponse.redirect(`${APP_URL}/login?verify=success`);
}
