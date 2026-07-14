import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH update an announcement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const { message, isActive } = body;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  // If activating this one, deactivate all others
  if (isActive && !existing.isActive) {
    await prisma.announcement.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const updateData: { message?: string; isActive?: boolean } = {};
  if (message !== undefined) updateData.message = message.trim();
  if (isActive !== undefined) updateData.isActive = isActive;

  const announcement = await prisma.announcement.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(announcement);
}

// DELETE an announcement
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  }

  await prisma.announcement.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
