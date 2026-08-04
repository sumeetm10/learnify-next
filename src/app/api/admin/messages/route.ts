import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET: List messages with filter
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "all"; // all, unread, archived
  const parsed = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const limit = 20;

  const where: Prisma.ContactMessageWhereInput = {};
  if (status === "unread") {
    where.isRead = false;
    where.isArchived = false;
  }
  if (status === "archived") where.isArchived = true;
  if (status === "all") where.isArchived = false; // "all" means non-archived

  const [messages, total, unreadCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count({
      where,
    }),
    prisma.contactMessage.count({ where: { isRead: false, isArchived: false } }),
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

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messageId, isRead, isArchived } = payload;
  if (!messageId) {
    return NextResponse.json({ error: "messageId required" }, { status: 400 });
  }

  const updateData: Record<string, boolean> = {};
  if (typeof isRead === "boolean") updateData.isRead = isRead;
  if (typeof isArchived === "boolean") updateData.isArchived = isArchived;

  try {
    const message = await prisma.contactMessage.update({
      where: { id: messageId },
      data: updateData,
    });
    return NextResponse.json(message);
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    throw e;
  }
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

  try {
    await prisma.contactMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    throw e;
  }
}
