import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const semesters = await prisma.semester.findMany({
    include: {
      course: { select: { name: true } },
      _count: { select: { subjects: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(semesters);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, name, courseId } = await request.json();
  if (!name || !courseId)
    return NextResponse.json(
      { error: "Name and course are required" },
      { status: 400 }
    );

  const data: { name: string; courseId: string; id?: number } = { name, courseId };
  if (id) data.id = parseInt(id);

  const semester = await prisma.semester.create({ data });
  return NextResponse.json(semester);
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id, name, courseId } = await request.json();
  if (!id)
    return NextResponse.json(
      { error: "ID required" },
      { status: 400 }
    );

  const data: Record<string, unknown> = {};
  if (name) data.name = name;
  if (courseId) data.courseId = courseId;

  const semester = await prisma.semester.update({
    where: { id: parseInt(id) },
    data,
  });
  return NextResponse.json(semester);
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "ID required" }, { status: 400 });

  const subjectCount = await prisma.subject.count({
    where: { semesterId: parseInt(id) },
  });
  if (subjectCount > 0) {
    return NextResponse.json(
      { error: "Cannot delete semester with subjects. Delete subjects first." },
      { status: 400 }
    );
  }

  await prisma.semester.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
