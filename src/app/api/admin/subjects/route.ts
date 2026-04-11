import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const semesterId = searchParams.get("semesterId");

  const subjects = await prisma.subject.findMany({
    where: semesterId ? { semesterId: parseInt(semesterId) } : undefined,
    include: {
      semester: { select: { name: true } },
      _count: { select: { chapters: true } },
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(subjects);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, title, description, icon, semesterId } = await request.json();
  if (!id || !title || !description || !icon || !semesterId)
    return NextResponse.json(
      { error: "All fields required" },
      { status: 400 }
    );

  const subject = await prisma.subject.create({
    data: { id, title, description, icon, semesterId: parseInt(semesterId) },
  });
  return NextResponse.json(subject);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, title, description, icon, semesterId } = await request.json();
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description;
  if (icon !== undefined) data.icon = icon;
  if (semesterId !== undefined) data.semesterId = parseInt(semesterId);

  const subject = await prisma.subject.update({ where: { id }, data });
  return NextResponse.json(subject);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const chapterCount = await prisma.chapter.count({
    where: { subjectId: id },
  });
  if (chapterCount > 0) {
    return NextResponse.json(
      {
        error:
          "Cannot delete subject with chapters. Delete chapters first.",
      },
      { status: 400 }
    );
  }

  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
