import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, subject, message } = body;

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  let userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!userId && email) {
    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
      select: { id: true },
    });
    userId = existing?.id ?? null;
  }

  await prisma.contactMessage.create({
    data: { name, email, subject, message, userId },
  });

  return NextResponse.json({ success: true });
}
