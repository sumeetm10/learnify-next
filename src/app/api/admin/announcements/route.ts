import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const MAX_MESSAGE_LENGTH = 500;

function validateColor(color: unknown): string | null {
  if (typeof color !== "string") return null;
  return COLOR_REGEX.test(color) ? color : null;
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(announcements);
  } catch {
    return NextResponse.json({ error: "Failed to load announcements" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (body.message.trim().length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` }, { status: 400 });
    }

    const circleColor = validateColor(body.circleColor) ? body.circleColor : "#3b82f6";
    const boxColor = validateColor(body.boxColor) ? body.boxColor : "#3b82f6";
    const isActive = body.isActive ?? true;

    const data = {
      message: body.message.trim(),
      isActive,
      circleColor,
      boxColor,
    };

    // Enforce a single active announcement: when this one is active,
    // deactivate all existing active announcements first.
    const announcement = isActive
      ? (
          await prisma.$transaction([
            prisma.announcement.updateMany({
              where: { isActive: true },
              data: { isActive: false },
            }),
            prisma.announcement.create({ data }),
          ])
        )[1]
      : await prisma.announcement.create({ data });

    return NextResponse.json(announcement, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    const updateData: Record<string, string | boolean> = {};
    if (body.message !== undefined) {
      const trimmed = typeof body.message === "string" ? body.message.trim() : "";
      if (!trimmed) {
        return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
      }
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or less` }, { status: 400 });
      }
      updateData.message = trimmed;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.circleColor !== undefined) {
      const color = validateColor(body.circleColor);
      if (color) updateData.circleColor = color;
    }
    if (body.boxColor !== undefined) {
      const color = validateColor(body.boxColor);
      if (color) updateData.boxColor = color;
    }

    // Enforce a single active announcement: when this one is being set
    // active, deactivate all others first within the same transaction.
    const announcement =
      updateData.isActive === true
        ? (
            await prisma.$transaction([
              prisma.announcement.updateMany({
                where: { NOT: { id: body.id }, isActive: true },
                data: { isActive: false },
              }),
              prisma.announcement.update({
                where: { id: body.id },
                data: updateData,
              }),
            ])
          )[1]
        : await prisma.announcement.update({
            where: { id: body.id },
            data: updateData,
          });

    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ error: "Failed to update announcement" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ error: "Announcement ID is required" }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id: body.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
