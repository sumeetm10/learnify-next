import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(announcements);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      message: body.message.trim(),
      isActive: body.isActive ?? true,
      circleColor: body.circleColor || "#3b82f6",
      boxColor: body.boxColor || "#3b82f6",
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
  }

  const updateData: Record<string, string | boolean> = {};
  if (body.message !== undefined) updateData.message = body.message.trim();
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.circleColor !== undefined) updateData.circleColor = body.circleColor;
  if (body.boxColor !== undefined) updateData.boxColor = body.boxColor;

  const announcement = await prisma.announcement.update({
    where: { id: body.id },
    data: updateData,
  });

  return NextResponse.json(announcement);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
  }

  await prisma.announcement.delete({
    where: { id: body.id },
  });

  return NextResponse.json({ success: true });
}
