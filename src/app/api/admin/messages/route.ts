import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: List messages with filter
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all"; // all, unread, archived
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status === "unread") where.isRead = false;
  if (status === "archived") where.isArchived = true;
  if (status === "all") where.isArchived = false; // "all" means non-archived

  const [messages, total, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where: where as any,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({
      where: where as any,
    }),
    prisma.contactMessage.count({ where: { isRead: false } }),
  ]);

  return NextResponse.json({
    messages,
    total,
    unreadCount,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// PATCH: Update message status (mark read, archive)
export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { messageId, isRead, isArchived } = await request.json();
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const updateData: Record<string, boolean> = {};
  if (typeof isRead === "boolean") updateData.isRead = isRead;
  if (typeof isArchived === "boolean") updateData.isArchived = isArchived;

  const message = await prisma.contactMessage.update({
    where: { id: messageId },
    data: updateData,
  });

  return NextResponse.json(message);
}

// DELETE: Permanently delete a message
export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.contactMessage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
